from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
import re
import time
import unicodedata
import urllib.parse
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "src" / "data"
CARD_DIR = ROOT / "public" / "cards"
THUMB_DIR = CARD_DIR / "thumbs"
MANUAL_TITLE = "Manual do Tarô de Waite"
COMMONS_CATEGORY = "Category:Rider-Waite tarot deck (Roses & Lilies)"


MAJORS = [
    ("O Louco", "O arcano d'O Louco (0)", 0, "Fool"),
    ("O Mago", "O Mago (I)", 1, "Magician"),
    ("A Sacerdotisa", "A Sacerdotisa (II)", 2, "High Priestess"),
    ("A Imperatriz", "A Imperatriz (III)", 3, "Empress"),
    ("O Imperador", "O Imperador (IV)", 4, "Emperor"),
    ("O Hierofante", "O Hierofante (V)", 5, "Hierophant"),
    ("Os Enamorados", "Os Enamorados (VI)", 6, "Lovers"),
    ("O Carro", "O Carro (VII)", 7, "Chariot"),
    ("A Força", "A Força (VIII)", 8, "Strength"),
    ("O Eremita", "O Eremita (IX)", 9, "Hermit"),
    ("A Roda da Fortuna", "A Roda da Fortuna (X)", 10, "Wheel of Fortune"),
    ("A Justiça", "A Justiça (XI)", 11, "Justice"),
    ("O Enforcado", "O Enforcado (XII)", 12, "Hanged Man"),
    ("A Morte", "A Morte (XIII)", 13, "Death"),
    ("A Temperança", "A Temperança (XIV)", 14, "Temperance"),
    ("O Diabo", "O Diabo (XV)", 15, "Devil"),
    ("A Torre", "A Torre (XVI)", 16, "Tower"),
    ("A Estrela", "A Estrela (XVII)", 17, "Star"),
    ("A Lua", "A Lua (XVIII)", 18, "Moon"),
    ("O Sol", "O Sol (XIX)", 19, "Sun"),
    ("O Julgamento", "O Julgamento (XX)", 20, "Judgement"),
    ("O Mundo", "O Mundo (XXI)", 21, "World"),
]

SUITS = [
    ("cups", "Copas", "water", "Água", "Cups"),
    ("pentacles", "Ouros", "earth", "Terra", "Pentacles"),
    ("swords", "Espadas", "air", "Ar", "Swords"),
    ("wands", "Paus", "fire", "Fogo", "Wands"),
]

RANKS = [
    ("ace", "Ás", 1, None),
    ("two", "2", 2, None),
    ("three", "3", 3, None),
    ("four", "4", 4, None),
    ("five", "5", 5, None),
    ("six", "6", 6, None),
    ("seven", "7", 7, None),
    ("eight", "8", 8, None),
    ("nine", "9", 9, None),
    ("ten", "10", 10, None),
    ("page", "Pajem", 11, "page"),
    ("knight", "Cavaleiro", 12, "knight"),
    ("queen", "Rainha", 13, "queen"),
    ("king", "Rei", 14, "king"),
]

STOPWORDS = {
    "a", "o", "as", "os", "de", "da", "do", "das", "dos", "e", "em", "no", "na", "nos", "nas",
    "um", "uma", "uns", "umas", "que", "se", "como", "com", "por", "para", "ao", "aos", "à", "às",
    "seu", "sua", "seus", "suas", "este", "esta", "essa", "esse", "ou", "mais", "muito", "sobre",
    "carta", "arcano", "simboliza", "representa", "descreve", "atua", "surge", "entra", "revela",
}


def slugify(value: str) -> str:
    value = "".join(c for c in unicodedata.normalize("NFD", value) if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def plain(value: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", value) if unicodedata.category(c) != "Mn").lower()


def clean_text(value: str) -> str:
    value = unicodedata.normalize("NFC", value)
    value = re.sub(r"\s+", " ", value).strip()
    value = re.sub(r"\s+\d{1,2}\s*\.\s*", ". ", value)
    value = re.sub(r"\s+([,.;:!?])", r"\1", value)
    value = re.sub(r"([.!?])([A-ZÁÉÍÓÚÂÊÔÃÕÇ])", r"\1 \2", value)
    return value.strip(" -")


def normalize_pt_br(value: str) -> str:
    replacements = {
        "perspetiva": "perspectiva",
        "perspetivas": "perspectivas",
        "rececionar": "receber",
        "receção": "recepção",
        "projetará": "projetará",
        "factos": "fatos",
        "fato de foro": "fato recente",
        "económico": "econômico",
        "psicológico": "psicológico",
        "objetivo": "objetivo",
    }
    output = value
    for source, target in replacements.items():
        output = re.sub(rf"\b{source}\b", target, output, flags=re.IGNORECASE)
    return output


def find_after(text: str, needles: list[str], start: int = 0) -> int:
    normalized: list[str] = []
    offsets: list[int] = []
    for index, character in enumerate(text):
        for decomposed in unicodedata.normalize("NFD", character):
            if unicodedata.category(decomposed) != "Mn":
                normalized.append(decomposed.lower())
                offsets.append(index)
    haystack = "".join(normalized)
    normalized_start = next((i for i, original in enumerate(offsets) if original >= start), len(offsets))
    found = [haystack.find(plain(needle), normalized_start) for needle in needles]
    found = [position for position in found if position >= 0]
    return offsets[min(found)] if found else -1


def split_meanings(segment: str) -> tuple[str, str, str, str, bool]:
    segment = clean_text(segment)
    first_end_match = re.search(r"[.!?](?:\s|$)", segment)
    first_end = first_end_match.end() if first_end_match else min(len(segment), 240)
    career_markers = [
        "Profissionalmente", "Na carreira", "No âmbito da carreira", "Sob o escopo da carreira",
        "No espectro da carreira", "No campo corporativo", "No mundo profissional", "Na área profissional",
        "No campo profissional", "Na vertente ocupacional", "No mundo dos ofícios", "No campo dos ofícios",
        "Nas áreas dos ofícios", "Nas áreas laborais", "Em termos profissionais", "Na vida profissional",
        "No domínio profissional", "Laboralmente", "Em matéria laboral", "No trabalho", "Na carreira profissional",
        "No espetro do trabalho", "No espectro do trabalho", "No contexto profissional", "Nos assuntos profissionais",
        "Nas questões profissionais", "Na atuação profissional", "No plano profissional", "Em âmbito profissional",
        "Na esfera corporativa", "Nas lides profissionais", "No teatro das operações corporativas",
        "Nas projeções da carreira", "No teatro das organizações laborais", "No ambiente negocial",
        "Nas profissões",
    ]
    love_markers = [
        "Amorosamente", "No amor", "No contexto do amor", "No campo romântico", "Na área romântica",
        "Nas questões do coração", "Na vida amorosa", "No ambiente afetivo", "Afetivamente",
        "Na esfera afetiva", "No romance", "Romanticamente", "No campo amoroso", "Em matéria de amor",
        "Na dimensão romântica", "Na dimensão amorosa", "No plano amoroso", "Nas relações amorosas",
        "Na área sentimental", "Nas relações interpessoais", "No campo das paixões amorosas",
        "Nas relações, é",
    ]
    career = find_after(segment, career_markers, first_end)
    if career < 0:
        career = find_after(segment, ["carreira", "profissional", "corporativo", "ocupacional", "ofícios", "laboral"], first_end + 40)
    love = find_after(segment, love_markers, max(first_end, career + 20))
    if love < 0:
        love = find_after(segment, ["amor", "romântic", "afetiv", "coração", "relacionamento"], max(first_end, career + 80))

    def start_of_sentence(position: int, minimum: int) -> int:
        if position < 0:
            return position
        boundary = segment.rfind(". ", minimum, position)
        return boundary + 2 if boundary >= minimum else position

    career = start_of_sentence(career, first_end)
    love = start_of_sentence(love, max(first_end, career + 1))

    valid = career > first_end and love > career
    if not valid:
        general = segment[:first_end].strip()
        future = segment[first_end:].strip()
        return normalize_pt_br(general), normalize_pt_br(future), "", "", False

    general = segment[:first_end].strip()
    future = segment[first_end:career].strip()
    career_text = segment[career:love].strip()
    love_text = segment[love:].strip()
    return tuple(normalize_pt_br(part) for part in (general, future, career_text, love_text)) + (valid,)


def keywords_from(text: str, base: list[str]) -> list[str]:
    words = re.findall(r"[A-Za-zÀ-ÿ]{5,}", text)
    unique: list[str] = []
    for word in words:
        normalized = word.lower()
        if normalized not in STOPWORDS and normalized not in unique:
            unique.append(normalized)
        if len(unique) == 4:
            break
    return list(dict.fromkeys(base + unique))[:7]


def locate_page(offset: int, page_ranges: list[tuple[int, int]]) -> int:
    for index, (start, end) in enumerate(page_ranges):
        if start <= offset < end:
            return index + 1
    return len(page_ranges)


def build_definitions() -> list[dict]:
    definitions: list[dict] = []
    for order, (name, marker, number, english) in enumerate(MAJORS):
        filename = f"RWS1909 - {number:02d} {english}.jpeg"
        definitions.append({
            "name": name, "marker": marker, "number": number, "arcanaType": "major", "deckOrder": order,
            "imageFile": filename,
        })
    order = len(definitions)
    for suit, suit_pt, element, element_pt, commons_suit in SUITS:
        for rank_id, rank_pt, number, court_rank in RANKS:
            name = f"{rank_pt} de {suit_pt}"
            definitions.append({
                "name": name,
                "marker": f"O {name}" if rank_id not in {"queen"} else f"A {name}",
                "number": number,
                "arcanaType": "minor",
                "suit": suit,
                "suitLabel": suit_pt,
                "element": element,
                "elementLabel": element_pt,
                "rank": court_rank,
                "deckOrder": order,
                "imageFile": f"RWS1909 - {commons_suit} {number:02d}.jpeg",
            })
            order += 1
    return definitions


def extract_cards(pdf_path: Path) -> list[dict]:
    reader = PdfReader(str(pdf_path))
    pages = [clean_text(page.extract_text() or "") for page in reader.pages]
    chunks: list[str] = []
    page_ranges: list[tuple[int, int]] = []
    offset = 0
    for page in pages:
        chunks.append(page)
        page_ranges.append((offset, offset + len(page)))
        offset += len(page) + 1
    full_text = " ".join(chunks)
    definitions = build_definitions()

    positions: list[int] = []
    cursor = 0
    for definition in definitions:
        match = re.search(re.escape(definition["marker"]), full_text[cursor:], re.IGNORECASE)
        if not match:
            raise RuntimeError(f"Marcador não encontrado: {definition['marker']}")
        position = cursor + match.start()
        positions.append(position)
        cursor = position + len(definition["marker"])
    end_match = re.search(r"Parte III", full_text[positions[-1]:], re.IGNORECASE)
    final_end = positions[-1] + end_match.start() if end_match else len(full_text)

    cards: list[dict] = []
    for index, definition in enumerate(definitions):
        start = positions[index]
        end = positions[index + 1] if index + 1 < len(positions) else final_end
        original = clean_text(full_text[start:end])
        original = re.split(r"\s+(?:Parte II:|O Naipe de (?:Ouros|Espadas|Paus) \(Elemento)", original, maxsplit=1)[0]
        general, future, career, love, valid = split_meanings(original)
        slug = slugify(definition["name"])
        source_start = locate_page(start, page_ranges)
        source_end = locate_page(max(start, end - 1), page_ranges)
        base_keywords = ["arcano maior"] if definition["arcanaType"] == "major" else [
            definition["suitLabel"].lower(), definition["elementLabel"].lower()
        ]
        cards.append({
            "id": slug,
            "slug": slug,
            "name": definition["name"],
            "originalName": definition["imageFile"].removeprefix("RWS1909 - ").removesuffix(".jpeg"),
            "number": definition["number"],
            "deckOrder": definition["deckOrder"],
            "arcanaType": definition["arcanaType"],
            **({"suit": definition["suit"]} if definition.get("suit") else {}),
            **({"element": definition["element"]} if definition.get("element") else {}),
            **({"rank": definition["rank"]} if definition.get("rank") else {}),
            "image": f"/cards/{slug}.webp",
            "thumbnail": f"/cards/thumbs/{slug}.webp",
            "keywords": keywords_from(general, base_keywords),
            "archetype": general,
            "summary": general,
            "meanings": {
                "general": general,
                "future": future,
                "career": career,
                "love": love,
            },
            "symbolism": [],
            "source": {
                "documentTitle": MANUAL_TITLE,
                "pageStart": source_start,
                "pageEnd": source_end,
                "originalText": original,
                "normalizedText": normalize_pt_br(original),
            },
            "imageAttribution": {
                "collection": "Rider-Waite tarot deck (Roses & Lilies)",
                "fileName": definition["imageFile"],
                "sourceUrl": "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(definition["imageFile"].replace(" ", "_")),
                "license": "Public Domain Mark 1.0",
                "creator": "Pamela Colman Smith; Arthur Edward Waite",
            },
            "reviewStatus": "approved" if valid and min(len(future), len(career), len(love)) > 40 else "needs-review",
        })
    return cards


def spread_position(position_id: str, order: int, name: str, description: str, x: float, y: float, rotation: float = 0, orientation: str = "vertical") -> dict:
    return {
        "id": position_id, "order": order, "name": name, "description": description,
        "x": x, "y": y, "rotation": rotation, "orientation": orientation, "compactOrder": order,
    }


def build_spreads() -> list[dict]:
    three = [
        ("linha-do-tempo", "Linha do tempo", "Observe como passado, presente e tendência se conectam.", [
            ("Passado", "Raízes e acontecimentos que ainda influenciam a questão."),
            ("Presente", "A energia e as condições atuantes neste momento."),
            ("Futuro ou tendência", "O movimento provável caso o caminho atual seja mantido."),
        ]),
        ("aconselhamento", "Aconselhamento", "Enxergue a situação, o obstáculo e uma atitude possível.", [
            ("Situação base", "O núcleo da questão e sua condição atual."),
            ("Bloqueio ou desafio", "O que cria atrito, limite ou pede compreensão."),
            ("Conselho", "A postura que pode ajudar a lidar com o cenário."),
        ]),
        ("polaridades", "Polaridades", "Compare forças favoráveis e tensões antes de observar o desfecho.", [
            ("Lado positivo", "Recursos, oportunidades e forças que apoiam a questão."),
            ("Lado negativo", "Riscos, limites e forças que pedem cautela."),
            ("Resultado final", "A síntese das polaridades em movimento."),
        ]),
    ]
    spreads = [
        {
            "id": "carta-unica", "slug": "carta-unica", "name": "Carta única",
            "description": "Uma mensagem central para perguntas rápidas ou para uma carta que saltou sozinha do baralho.",
            "cardCount": 1, "difficulty": "beginner", "duration": "1–3 min",
            "recommendedFor": ["carta que saltou", "mensagem do momento", "questões simples"],
            "positions": [spread_position("mensagem-central", 1, "Mensagem central", "O símbolo principal que responde à pergunta ou pede atenção neste momento.", 50, 50)],
        },
        {
            "id": "duas-cartas", "slug": "duas-cartas", "name": "Duas cartas",
            "description": "Leia duas cartas que saltaram juntas como mensagem principal e complemento ou contraponto.",
            "cardCount": 2, "difficulty": "beginner", "duration": "2–4 min",
            "recommendedFor": ["duas cartas que saltaram", "contraste", "confirmação"],
            "positions": [
                spread_position("mensagem-principal", 1, "Mensagem principal", "A primeira carta apresenta o núcleo da resposta e o aspecto que surgiu primeiro.", 32, 50, -2),
                spread_position("complemento", 2, "Complemento ou contraponto", "A segunda carta reforça, modifica ou contrapõe a mensagem inicial.", 68, 50, 2),
            ],
        },
        {
            "id": "cartas-que-saltaram", "slug": "cartas-que-saltaram", "name": "Cartas que saltaram",
            "description": "Registre livremente de quatro a doze cartas que saltaram durante o embaralhamento e interprete a sequência completa.",
            "cardCount": 4, "kind": "custom", "minCardCount": 4, "maxCardCount": 12,
            "difficulty": "intermediate", "duration": "5–20 min",
            "recommendedFor": ["4 ou mais cartas que saltaram", "sequências espontâneas", "leitura livre"],
            "positions": [
                spread_position(f"salto-{index + 1}", index + 1, f"{index + 1}ª carta que saltou", "Símbolo que deve ser lido na ordem espontânea em que emergiu do baralho.", [14, 38, 62, 86][index], 50, [-3, -1, 1, 3][index])
                for index in range(4)
            ],
        },
    ]
    for slug, name, description, positions in three:
        spreads.append({
            "id": slug, "slug": slug, "name": name, "description": description, "cardCount": 3,
            "difficulty": "beginner", "duration": "3–5 min", "recommendedFor": ["questões rápidas", "clareza", "decisões pontuais"],
            "positions": [spread_position(f"p{i+1}", i + 1, title, detail, [18, 50, 82][i], 50) for i, (title, detail) in enumerate(positions)],
        })

    celtic_positions = [
        ("Causa presente", "Energia primária e estado consciente da situação.", 40, 50, 0, "vertical"),
        ("Bloqueio ou cruz", "Força que atravessa o presente, criando atrito ou impulso.", 40, 50, 90, "horizontal"),
        ("Passado causal", "Raízes remotas que alimentam a questão.", 18, 50, 0, "vertical"),
        ("Passado imediato", "Fatos recentes em transição ou saída.", 62, 50, 0, "vertical"),
        ("Inconsciente oculto", "Fatores profundos ainda não reconhecidos.", 40, 16, 0, "vertical"),
        ("Rumo futuro", "Tendência de curto prazo do movimento atual.", 40, 84, 0, "vertical"),
        ("Autossabotagem", "Atitudes pessoais, medos e padrões que interferem.", 84, 84, 0, "vertical"),
        ("Meio envolvente", "Condições externas, pessoas e ambiente.", 84, 62, 0, "vertical"),
        ("Temores e esperanças", "Desejos e receios que influenciam a leitura.", 84, 39, 0, "vertical"),
        ("Sentença final", "Síntese e tendência resultante do conjunto.", 84, 16, 0, "vertical"),
    ]
    spreads.append({
        "id": "cruz-celta", "slug": "cruz-celta", "name": "Cruz Celta",
        "description": "Uma leitura profunda das origens, influências internas, ambiente e tendência da situação.",
        "cardCount": 10, "difficulty": "advanced", "duration": "12–18 min",
        "recommendedFor": ["questões complexas", "padrões profundos", "visão ampla"],
        "positions": [spread_position(f"p{i+1}", i + 1, *values) for i, values in enumerate(celtic_positions)],
    })

    houses = [
        ("Casa 1 — Áries", "Identidade, vitalidade e iniciativas"),
        ("Casa 2 — Touro", "Finanças, recursos e posses"),
        ("Casa 3 — Gêmeos", "Comunicação, rotina e relações próximas"),
        ("Casa 4 — Câncer", "Família, origem e segurança emocional"),
        ("Casa 5 — Leão", "Criatividade, romances, filhos e lazer"),
        ("Casa 6 — Virgem", "Trabalho cotidiano, saúde e obrigações"),
        ("Casa 7 — Libra", "Relacionamentos, sociedades e contratos"),
        ("Casa 8 — Escorpião", "Transformação, crises e recursos compartilhados"),
        ("Casa 9 — Sagitário", "Estudos, filosofia, viagens e expansão"),
        ("Casa 10 — Capricórnio", "Carreira, reputação e objetivos sociais"),
        ("Casa 11 — Aquário", "Amizades, grupos, inovação e comunidade"),
        ("Casa 12 — Peixes", "Inconsciente, isolamento, segredos e espiritualidade"),
    ]
    mandala_positions = []
    for index, (name, description) in enumerate(houses):
        angle = math.radians(-90 + index * 30)
        mandala_positions.append(spread_position(
            f"casa-{index+1}", index + 1, name, description,
            round(50 + 40 * math.cos(angle), 2), round(50 + 40 * math.sin(angle), 2), round(index * 2 - 11, 2),
        ))
    spreads.append({
        "id": "mandala-astrologica", "slug": "mandala-astrologica", "name": "Mandala Astrológica",
        "description": "Doze casas para observar um ciclo amplo de vida, relações, trabalho e transformação.",
        "cardCount": 12, "difficulty": "advanced", "duration": "15–22 min",
        "recommendedFor": ["ciclo anual", "visão holística", "múltiplas áreas da vida"],
        "positions": mandala_positions,
    })
    return spreads


def build_guide() -> list[dict]:
    return [
        {"id": "o-que-e", "title": "O Tarô de Waite", "sourcePages": [1], "body": "O sistema Rider-Waite-Smith organiza imagens e arquétipos como um instrumento de reflexão. As cartas ajudam a observar padrões, influências e possibilidades; não determinam certezas absolutas."},
        {"id": "arcanos-maiores", "title": "Arcanos Maiores", "sourcePages": [1, 6], "body": "As 22 cartas maiores representam forças estruturais, arquétipos e pontos de inflexão da jornada humana. Sua presença costuma ampliar a importância simbólica de uma posição."},
        {"id": "arcanos-menores", "title": "Arcanos Menores", "sourcePages": [6, 7], "body": "As 56 cartas menores aproximam a leitura do cotidiano. Elas se distribuem em quatro naipes, cada um relacionado a uma esfera de experiência e a um elemento."},
        {"id": "naipes", "title": "Naipes e elementos", "sourcePages": [6, 7], "body": "Copas se relaciona à Água e à vida emocional; Ouros à Terra e à realidade material; Espadas ao Ar e à mente; Paus ao Fogo, à vontade e à ação."},
        {"id": "pergunta", "title": "Como formular uma pergunta", "sourcePages": [25], "body": "Prefira perguntas abertas sobre caminhos, influências e atitudes. Em vez de perguntar apenas ‘sim ou não’, investigue o que precisa compreender, quais fatores atuam e como pode lidar melhor com a situação."},
        {"id": "preparacao", "title": "Preparação para a leitura", "sourcePages": [25], "body": "Reserve um momento de atenção, formule a questão com clareza e trate o embaralhamento como uma pausa de concentração. No Limiar, embaralhe, corte e retire as cartas com seu baralho físico; depois registre no site a sequência obtida."},
        {"id": "escolher-tiragem", "title": "Como escolher uma tiragem", "sourcePages": [25, 31], "body": "Use uma carta para uma mensagem central e duas cartas para observar complemento ou contraponto. Se quatro ou mais cartas saltarem durante o embaralhamento, preserve a ordem e registre a sequência na tiragem personalizada. Use três cartas para questões objetivas, a Cruz Celta para situações complexas e a Mandala Astrológica para observar várias áreas ao longo de um ciclo amplo."},
        {"id": "interpretar-posicoes", "title": "Carta e posição", "sourcePages": [26, 31], "body": "Uma carta não é interpretada isoladamente: a posição define a pergunta específica que ela responde. Leia primeiro o papel da posição e então relacione o significado da carta ao tema selecionado."},
        {"id": "limites", "title": "Limites e responsabilidade", "sourcePages": [25], "body": "A leitura é informativa, simbólica e reflexiva. Ela não substitui aconselhamento médico, psicológico, jurídico ou financeiro profissional."},
    ]


def fetch_commons_files(file_names: set[str]) -> dict[str, dict]:
    files: dict[str, dict] = {}
    ordered = sorted(file_names)
    for start in range(0, len(ordered), 40):
        batch = ordered[start:start + 40]
        params = urllib.parse.urlencode({
            "action": "query", "format": "json", "prop": "imageinfo", "iiprop": "url|sha1",
            "iiurlwidth": "960", "titles": "|".join(f"File:{name}" for name in batch),
        })
        request = urllib.request.Request("https://commons.wikimedia.org/w/api.php?" + params, headers={"User-Agent": "LimiarTarot/1.0 content preparation (educational project)"})
        with urllib.request.urlopen(request, timeout=45) as response:
            payload = json.load(response)
        for page in payload["query"]["pages"].values():
            if "imageinfo" in page:
                files[page["title"].removeprefix("File:")] = page["imageinfo"][0]
        time.sleep(1)
    return files


def download_images(cards: list[dict], mirror_dir: Path | None = None) -> list[dict]:
    CARD_DIR.mkdir(parents=True, exist_ok=True)
    THUMB_DIR.mkdir(parents=True, exist_ok=True)
    commons_files: dict[str, dict] = {}
    if mirror_dir is None:
        expected = {card["imageAttribution"]["fileName"] for card in cards}
        commons_files = fetch_commons_files(expected)
        missing = expected - set(commons_files)
        if missing:
            raise RuntimeError("Arquivos ausentes no Commons: " + ", ".join(sorted(missing)))

    manifest = []
    for index, card in enumerate(cards, start=1):
        filename = card["imageAttribution"]["fileName"]
        local_path = CARD_DIR / f"{card['slug']}.webp"
        thumb_path = THUMB_DIR / f"{card['slug']}.webp"
        if mirror_dir is not None or not local_path.exists() or not thumb_path.exists():
            if mirror_dir is not None:
                prefix = "m" if card["arcanaType"] == "major" else {"cups": "c", "pentacles": "p", "swords": "s", "wands": "w"}[card["suit"]]
                mirror_path = mirror_dir / f"{prefix}{card['number']:02d}.jpg"
                if not mirror_path.exists():
                    raise FileNotFoundError(mirror_path)
                raw = mirror_path.read_bytes()
            else:
                image_url = commons_files[filename].get("thumburl", commons_files[filename]["url"])
                request = urllib.request.Request(image_url, headers={"User-Agent": "LimiarTarot/1.0 content preparation (educational project)"})
                raw = None
                for attempt in range(6):
                    try:
                        with urllib.request.urlopen(request, timeout=60) as response:
                            raw = response.read()
                        break
                    except urllib.error.HTTPError as error:
                        if error.code != 429 or attempt == 5:
                            raise
                        time.sleep(20 * (attempt + 1))
                assert raw is not None
            image = Image.open(io.BytesIO(raw)).convert("RGB")
            image.thumbnail((960, 1600), Image.Resampling.LANCZOS)
            image.save(local_path, "WEBP", quality=86, method=6)
            thumb = image.copy()
            thumb.thumbnail((360, 620), Image.Resampling.LANCZOS)
            thumb.save(thumb_path, "WEBP", quality=82, method=6)
            if mirror_dir is None:
                time.sleep(2.5)
        checksum = hashlib.sha256(local_path.read_bytes()).hexdigest()
        manifest.append({
            "cardId": card["id"], **card["imageAttribution"], "sha256": checksum,
            "localImage": card["image"], "localThumbnail": card["thumbnail"],
            **({"transportMirror": "https://github.com/metabismuth/tarot-json"} if mirror_dir else {}),
        })
        print(f"[{index:02d}/78] {card['name']}")
    return manifest


def validate(cards: list[dict], manifest: list[dict] | None = None) -> None:
    assert len(cards) == 78
    assert len({card["id"] for card in cards}) == 78
    assert len([card for card in cards if card["arcanaType"] == "major"]) == 22
    assert len([card for card in cards if card["arcanaType"] == "minor"]) == 56
    for suit, *_ in SUITS:
        assert len([card for card in cards if card.get("suit") == suit]) == 14
    for card in cards:
        assert len(card["meanings"]["general"]) > 20 and len(card["meanings"]["future"]) > 20, card["name"]
        if card["reviewStatus"] == "approved":
            assert all(len(card["meanings"][key]) > 20 for key in ("career", "love")), card["name"]
        assert 1 <= card["source"]["pageStart"] <= card["source"]["pageEnd"] <= 32
        assert card["source"]["originalText"]
    if manifest is not None:
        assert len(manifest) == 78


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path)
    parser.add_argument("--skip-images", action="store_true")
    parser.add_argument("--mirror-dir", type=Path)
    args = parser.parse_args()
    pdf_path = args.pdf
    if pdf_path is None:
        candidates = list((Path.home() / "Downloads").glob("Manual do Tar* de Waite.pdf"))
        if not candidates:
            raise FileNotFoundError("Manual do Tarô de Waite.pdf não encontrado em Downloads")
        pdf_path = candidates[0]

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    cards = extract_cards(pdf_path)
    manifest = None if args.skip_images else download_images(cards, args.mirror_dir)
    validate(cards, manifest)
    (DATA_DIR / "tarot-cards.json").write_text(json.dumps(cards, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA_DIR / "tarot-spreads.json").write_text(json.dumps(build_spreads(), ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA_DIR / "tarot-guide.json").write_text(json.dumps(build_guide(), ensure_ascii=False, indent=2), encoding="utf-8")
    if manifest is not None:
        (DATA_DIR / "image-licenses.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    report = {
        "total": len(cards),
        "major": sum(card["arcanaType"] == "major" for card in cards),
        "minor": sum(card["arcanaType"] == "minor" for card in cards),
        "approved": sum(card["reviewStatus"] == "approved" for card in cards),
        "needsReview": sum(card["reviewStatus"] == "needs-review" for card in cards),
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
