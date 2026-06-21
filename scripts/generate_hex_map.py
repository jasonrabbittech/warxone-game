#!/usr/bin/env python3
"""
Generate hex-grid map data for WarXOne game.
Outputs: countryPaths.js, marsPaths.js, countries.js (adjacency), marsCountries.js (adjacency)
"""
import math
import json

# ─── Hex grid utilities ───────────────────────────────────────────────

HEX_SIZE = 52  # radius from center to vertex
HEX_W = math.sqrt(3) * HEX_SIZE  # ~90.07
HEX_H = 2 * HEX_SIZE  # 104
COL_SPACING = HEX_W
ROW_SPACING = HEX_H * 0.75  # 78

def hex_center(col, row, sx, sy):
    """Center of pointy-top hex at grid (col, row) with block origin (sx, sy)"""
    cx = sx + col * COL_SPACING + (row % 2) * COL_SPACING / 2
    cy = sy + row * ROW_SPACING
    return (round(cx), round(cy))

def hex_path(cx, cy, size=HEX_SIZE):
    """SVG path string for a pointy-top hexagon"""
    w = math.sqrt(3) * size / 2
    pts = [
        (cx, cy - size),
        (cx + w, cy - size / 2),
        (cx + w, cy + size / 2),
        (cx, cy + size),
        (cx - w, cy + size / 2),
        (cx - w, cy - size / 2),
    ]
    coords = " ".join(f"{x:.0f},{y:.0f}" for x, y in pts)
    return f"M {coords} Z"

def hex_neighbors_offset(col, row):
    """Get all valid neighbor positions for offset hex grid (pointy-top, even-r offset)"""
    if row % 2 == 0:  # even row
        return [
            (col - 1, row - 1), (col, row - 1),
            (col - 1, row), (col + 1, row),
            (col - 1, row + 1), (col, row + 1),
        ]
    else:  # odd row
        return [
            (col, row - 1), (col + 1, row - 1),
            (col - 1, row), (col + 1, row),
            (col, row + 1), (col + 1, row + 1),
        ]

# ─── Earth Layout ─────────────────────────────────────────────────────

# Continent blocks: each is a list of rows, each row is a list of territory IDs (or None for empty)
# Organized to roughly preserve geographic adjacency relationships

EARTH_CONTINENTS = {
    'north_america': {
        'start': (40, 70),
        'grid': [
            ['canada', 'usa'],
            ['mexico', 'cuba'],
        ]
    },
    'south_america': {
        'start': (40, 260),
        'grid': [
            ['colombia', 'venezuela'],
            ['peru', 'brazil'],
            ['chile', 'argentina'],
        ]
    },
    'europe_north': {
        'start': (350, 50),
        'grid': [
            ['norway', 'sweden', 'finland'],
            ['ireland', 'uk', 'denmark'],
            ['portugal', 'netherlands', 'belgium'],
        ]
    },
    'europe_west': {
        'start': (350, 285),
        'grid': [
            ['spain', 'france', 'switzerland'],
            ['italy', 'germany', 'czech'],
        ]
    },
    'europe_east': {
        'start': (625, 285),
        'grid': [
            ['austria', 'slovakia', 'poland'],
            ['hungary', 'romania', 'moldova'],
            ['croatia', 'serbia', 'ukraine'],
            ['bosnia', 'bulgaria', 'russia'],
        ]
    },
    'europe_south': {
        'start': (350, 440),
        'grid': [
            ['greece', 'albania', 'north_macedonia'],
            ['estonia', 'latvia', 'lithuania'],
        ]
    },
    'middle_east': {
        'start': (625, 515),
        'grid': [
            ['turkey', 'syria', 'iraq'],
            ['israel', 'saudi_arabia', 'iran'],
            [None, 'afghanistan', 'pakistan'],
        ]
    },
    'asia_east': {
        'start': (900, 50),
        'grid': [
            ['kazakhstan', 'mongolia', 'north_korea'],
            ['china', 'south_korea', 'japan'],
            ['india', 'vietnam', 'philippines'],
            ['bangladesh', 'thailand', 'indonesia'],
        ]
    },
    'africa_north': {
        'start': (350, 600),
        'grid': [
            ['morocco', 'algeria', 'libya', 'egypt'],
            ['ghana', 'nigeria', 'sudan', 'ethiopia'],
        ]
    },
    'africa_south': {
        'start': (350, 755),
        'grid': [
            ['cameroon', 'drc', 'kenya', 'tanzania'],
            ['angola', None, 'madagascar', None],
            ['south_africa', None, None, None],
        ]
    },
    'oceania': {
        'start': (900, 440),
        'grid': [
            ['papua_new_guinea', 'australia', 'new_zealand'],
        ]
    },
}

# Cross-continent adjacencies (manual overrides for geographically connected territories)
EARTH_CROSS_ADJACENCY = [
    # Americas
    ('usa', 'canada'), ('usa', 'mexico'), ('mexico', 'cuba'),
    ('colombia', 'venezuela'), ('colombia', 'peru'), ('colombia', 'brazil'),
    ('venezuela', 'brazil'), ('peru', 'brazil'), ('peru', 'chile'),
    ('brazil', 'argentina'), ('chile', 'argentina'),
    # Canada to USA already in hex neighbors
    # Europe cross-connections
    ('uk', 'france'), ('france', 'spain'), ('france', 'germany'), ('france', 'italy'), ('france', 'belgium'),
    ('germany', 'poland'), ('germany', 'austria'), ('germany', 'netherlands'), ('germany', 'denmark'),
    ('poland', 'ukraine'), ('poland', 'lithuania'),
    ('ukraine', 'russia'), ('ukraine', 'moldova'),
    ('russia', 'finland'), ('russia', 'estonia'), ('russia', 'latvia'),
    ('italy', 'austria'), ('italy', 'croatia'),
    ('hungary', 'austria'), ('hungary', 'serbia'), ('hungary', 'romania'),
    ('romania', 'bulgaria'), ('romania', 'moldova'),
    ('bulgaria', 'greece'), ('bulgaria', 'north_macedonia'), ('bulgaria', 'turkey'),
    ('greece', 'albania'), ('greece', 'north_macedonia'), ('greece', 'turkey'),
    ('serbia', 'bosnia'), ('serbia', 'croatia'), ('serbia', 'north_macedonia'),
    ('croatia', 'bosnia'),
    ('albania', 'north_macedonia'),
    ('switzerland', 'austria'), ('switzerland', 'italy'),
    ('slovakia', 'ukraine'), ('slovakia', 'austria'),
    ('spain', 'portugal'),
    ('sweden', 'norway'), ('sweden', 'finland'), ('norway', 'finland'),
    ('denmark', 'sweden'), ('netherlands', 'belgium'), ('netherlands', 'germany'),
    ('belgium', 'france'),
    ('estonia', 'latvia'), ('latvia', 'lithuania'), ('lithuania', 'poland'),
    # Middle East connections
    ('turkey', 'greece'), ('turkey', 'bulgaria'), ('turkey', 'iran'), ('turkey', 'iraq'), ('turkey', 'syria'),
    ('syria', 'iraq'), ('syria', 'israel'), ('iraq', 'iran'), ('iraq', 'saudi_arabia'),
    ('israel', 'egypt'), ('israel', 'saudi_arabia'),
    ('saudi_arabia', 'iran'), ('iran', 'afghanistan'), ('iran', 'pakistan'),
    ('afghanistan', 'pakistan'), ('afghanistan', 'china'),
    # Asia connections
    ('china', 'russia'), ('china', 'mongolia'), ('china', 'north_korea'), ('china', 'vietnam'),
    ('china', 'india'), ('china', 'kazakhstan'), ('china', 'pakistan'),
    ('india', 'pakistan'), ('india', 'bangladesh'),
    ('north_korea', 'south_korea'), ('north_korea', 'russia'),
    ('vietnam', 'thailand'), ('thailand', 'indonesia'),
    ('indonesia', 'papua_new_guinea'), ('japan', 'south_korea'),
    ('mongolia', 'russia'), ('kazakhstan', 'russia'),
    ('bangladesh', 'myanmar'), ('india', 'myanmar'),
    # Africa connections
    ('morocco', 'algeria'), ('algeria', 'libya'), ('libya', 'egypt'),
    ('libya', 'sudan'), ('egypt', 'sudan'), ('egypt', 'israel'),
    ('sudan', 'ethiopia'), ('sudan', 'drc'),
    ('nigeria', 'cameroon'), ('nigeria', 'ghana'),
    ('cameroon', 'drc'), ('drc', 'tanzania'), ('drc', 'angola'),
    ('kenya', 'ethiopia'), ('kenya', 'tanzania'),
    ('tanzania', 'madagascar'), ('angola', 'south_africa'),
    ('ghana', 'cameroon'), ('algeria', 'morocco'),
    # Europe-Asia bridge
    ('russia', 'kazakhstan'),
    # Oceania
    ('australia', 'new_zealand'), ('australia', 'papua_new_guinea'),
    ('indonesia', 'australia'),
]

# ─── Mars Layout ──────────────────────────────────────────────────────

MARS_CONTINENTS = {
    'core': {
        'start': (50, 70),
        'grid': [
            ['olympus_imperium', 'tharsis_dominion', 'elysium_collective'],
            ['vallis_marineris', 'noctis_labyrinth', 'arcadia_plains'],
            ['candor_chasma', 'melas_chasma', 'ophir_chasma'],
        ]
    },
    'east_mid': {
        'start': (310, 70),
        'grid': [
            ['utopia_basin', 'olympus_outpost', 'red_tharsis'],
            ['amazonis_planitia', 'sinai_planum', 'solis_planum'],
            ['coprates_chasma', 'lunae_planum', 'daedalia_planum'],
        ]
    },
    'volcanic': {
        'start': (570, 70),
        'grid': [
            ['polar_cap_north', 'tharsis_tholus', 'ascraeus_mons'],
            ['tempe_terra', 'alba_patera', 'pavonis_mons'],
            ['acidalia_planitia', 'chryse_planitia', 'arsia_mons'],
        ]
    },
    'lower_chasma': {
        'start': (50, 385),
        'grid': [
            ['juventae_chasma', 'xanthe_terra', 'capri_chasma'],
            ['aurorae_chaos', 'new_marineris', 'nepenthes_mensae'],
        ]
    },
    'east_lower': {
        'start': (310, 385),
        'grid': [
            ['isidis_planitia', 'gale_crater', 'spirit_plains'],
            ['tyrrhena_terra', 'elysium_mons', 'aeolis_dorsa'],
        ]
    },
    'hellas': {
        'start': (570, 385),
        'grid': [
            ['hellas_basin', 'hellas_rim', 'promethei_terra'],
            ['hesperia_planum', 'malea_planum', 'australe_planum'],
        ]
    },
    'south': {
        'start': (50, 540),
        'grid': [
            ['sirenum_terra', 'phaethontis', 'aonia_terra'],
            ['cimmeria_terra', 'polar_cap_south', None],
        ]
    },
}

MARS_CROSS_ADJACENCY = [
    # Core
    ('olympus_imperium', 'tharsis_dominion'), ('olympus_imperium', 'elysium_collective'),
    ('olympus_imperium', 'vallis_marineris'), ('olympus_imperium', 'olympus_outpost'),
    ('tharsis_dominion', 'noctis_labyrinth'), ('tharsis_dominion', 'arcadia_plains'),
    ('tharsis_dominion', 'olympus_outpost'), ('tharsis_dominion', 'red_tharsis'),
    ('elysium_collective', 'utopia_basin'), ('elysium_collective', 'amazonis_planitia'),
    ('elysium_collective', 'elysium_mons'),
    ('vallis_marineris', 'noctis_labyrinth'), ('vallis_marineris', 'candor_chasma'),
    ('vallis_marineris', 'melas_chasma'), ('vallis_marineris', 'new_marineris'),
    ('noctis_labyrinth', 'sinai_planum'), ('noctis_labyrinth', 'arcadia_plains'),
    ('arcadia_plains', 'tempe_terra'), ('arcadia_plains', 'alba_patera'),
    ('arcadia_plains', 'acidalia_planitia'),
    ('utopia_basin', 'isidis_planitia'), ('utopia_basin', 'nepenthes_mensae'),
    ('amazonis_planitia', 'lunae_planum'), ('amazonis_planitia', 'daedalia_planum'),
    # Chasma
    ('candor_chasma', 'melas_chasma'), ('candor_chasma', 'ophir_chasma'),
    ('candor_chasma', 'juventae_chasma'),
    ('melas_chasma', 'coprates_chasma'),
    ('ophir_chasma', 'sinai_planum'), ('ophir_chasma', 'juventae_chasma'),
    ('coprates_chasma', 'capri_chasma'), ('coprates_chasma', 'aurorae_chaos'),
    ('coprates_chasma', 'new_marineris'),
    ('sinai_planum', 'solis_planum'), ('sinai_planum', 'ophir_chasma'),
    ('solis_planum', 'lunae_planum'), ('solis_planum', 'daedalia_planum'),
    ('lunae_planum', 'tempe_terra'), ('lunae_planum', 'daedalia_planum'),
    ('daedalia_planum', 'phaethontis'),
    # Volcanic
    ('tempe_terra', 'alba_patera'), ('tempe_terra', 'lunae_planum'),
    ('alba_patera', 'tharsis_tholus'), ('alba_patera', 'polar_cap_north'),
    ('tharsis_tholus', 'ascraeus_mons'), ('ascraeus_mons', 'pavonis_mons'),
    ('pavonis_mons', 'arsia_mons'), ('pavonis_mons', 'red_tharsis'),
    ('arsia_mons', 'solis_planum'),
    ('acidalia_planitia', 'chryse_planitia'), ('acidalia_planitia', 'arcadia_plains'),
    ('chryse_planitia', 'xanthe_terra'),
    # Lower
    ('juventae_chasma', 'xanthe_terra'), ('xanthe_terra', 'chryse_planitia'),
    ('capri_chasma', 'aurorae_chaos'),
    ('aurorae_chaos', 'new_marineris'),
    ('nepenthes_mensae', 'isidis_planitia'), ('nepenthes_mensae', 'aeolis_dorsa'),
    ('isidis_planitia', 'tyrrhena_terra'),
    ('gale_crater', 'elysium_mons'), ('gale_crater', 'aeolis_dorsa'),
    ('gale_crater', 'spirit_plains'),
    ('spirit_plains', 'tyrrhena_terra'), ('spirit_plains', 'elysium_mons'),
    ('tyrrhena_terra', 'hellas_basin'), ('tyrrhena_terra', 'hesperia_planum'),
    ('elysium_mons', 'aeolis_dorsa'),
    # Hellas
    ('hellas_basin', 'hellas_rim'), ('hellas_basin', 'promethei_terra'),
    ('hellas_basin', 'hesperia_planum'),
    ('hellas_rim', 'promethei_terra'),
    ('promethei_terra', 'australe_planum'), ('promethei_terra', 'malea_planum'),
    ('hesperia_planum', 'malea_planum'),
    ('malea_planum', 'australe_planum'),
    ('australe_planum', 'sirenum_terra'), ('australe_planum', 'polar_cap_south'),
    # South
    ('sirenum_terra', 'phaethontis'), ('sirenum_terra', 'cimmeria_terra'),
    ('phaethontis', 'aonia_terra'), ('phaethontis', 'daedalia_planum'),
    ('aonia_terra', 'cimmeria_terra'),
    ('cimmeria_terra', 'aeolis_dorsa'), ('cimmeria_terra', 'polar_cap_south'),
    ('polar_cap_north', 'alba_patera'),
    ('red_tharsis', 'pavonis_mons'), ('red_tharsis', 'tharsis_dominion'),
    ('new_marineris', 'vallis_marineris'),
]


def generate_map_data(continents, cross_adjacency, country_data):
    """Generate paths and adjacency from hex grid layout."""
    positions = {}  # id -> (cx, cy)
    grid_map = {}   # (col, row, block_id) -> id
    block_cells = {} # block_id -> [(col, row)]
    
    # Place territories on hex grid
    for block_name, block in continents.items():
        sx, sy = block['start']
        cells = []
        for row_idx, row in enumerate(block['grid']):
            for col_idx, tid in enumerate(row):
                if tid is not None:
                    cx, cy = hex_center(col_idx, row_idx, sx, sy)
                    positions[tid] = (cx, cy)
                    grid_map[(col_idx, row_idx, block_name)] = tid
                    cells.append((col_idx, row_idx))
        block_cells[block_name] = cells
    
    # Generate paths
    paths = {}
    for tid, (cx, cy) in positions.items():
        paths[tid] = hex_path(cx, cy)
    
    # Generate adjacency from hex neighbors (within same block)
    adjacency = {tid: set() for tid in positions}
    
    for block_name, block in continents.items():
        for row_idx, row in enumerate(block['grid']):
            for col_idx, tid in enumerate(row):
                if tid is None:
                    continue
                # Check hex neighbors
                for nc, nr in hex_neighbors_offset(col_idx, row_idx):
                    neighbor = grid_map.get((nc, nr, block_name))
                    if neighbor is not None:
                        adjacency[tid].add(neighbor)
                        adjacency[neighbor].add(tid)
    
    # Add cross-continent adjacencies
    for a, b in cross_adjacency:
        if a in adjacency and b in adjacency:
            adjacency[a].add(b)
            adjacency[b].add(a)
    
    # Calculate viewBox
    if positions:
        min_x = min(cx - HEX_W/2 for cx, cy in positions.values())
        min_y = min(cy - HEX_SIZE for cx, cy in positions.values())
        max_x = max(cx + HEX_W/2 for cx, cy in positions.values())
        max_y = max(cy + HEX_SIZE for cx, cy in positions.values())
        padding = 40
        viewbox = {
            'x': round(min_x - padding),
            'y': round(min_y - padding),
            'w': round(max_x - min_x + 2 * padding),
            'h': round(max_y - min_y + 2 * padding)
        }
    else:
        viewbox = {'x': 0, 'y': 0, 'w': 1000, 'h': 700}
    
    return paths, adjacency, viewbox, positions


# ─── Country data (preserving game stats) ─────────────────────────────

EARTH_COUNTRY_DATA = {
    'france': {'name':'France','pop':20000,'military':1,'airports':1,'trains':1},
    'germany': {'name':'Germany','pop':20000,'military':1,'airports':1,'trains':1},
    'spain': {'name':'Spain','pop':18000,'military':1,'airports':1,'trains':1},
    'italy': {'name':'Italy','pop':19000,'military':1,'airports':1,'trains':1},
    'poland': {'name':'Poland','pop':17000,'military':1,'airports':1,'trains':1},
    'ukraine': {'name':'Ukraine','pop':21000,'military':2,'airports':1,'trains':1},
    'uk': {'name':'United Kingdom','pop':22000,'military':1,'airports':2,'trains':1},
    'russia': {'name':'Russia','pop':144000,'military':5,'airports':3,'trains':3},
    'sweden': {'name':'Sweden','pop':15000,'military':1,'airports':1,'trains':1},
    'norway': {'name':'Norway','pop':14000,'military':1,'airports':1,'trains':1},
    'finland': {'name':'Finland','pop':5500,'military':1,'airports':1,'trains':1},
    'denmark': {'name':'Denmark','pop':5800,'military':1,'airports':1,'trains':1},
    'netherlands': {'name':'Netherlands','pop':17000,'military':1,'airports':1,'trains':2},
    'belgium': {'name':'Belgium','pop':11000,'military':1,'airports':1,'trains':1},
    'switzerland': {'name':'Switzerland','pop':8000,'military':1,'airports':1,'trains':1},
    'austria': {'name':'Austria','pop':9000,'military':1,'airports':1,'trains':1},
    'czech': {'name':'Czechia','pop':10000,'military':1,'airports':1,'trains':1},
    'slovakia': {'name':'Slovakia','pop':5000,'military':1,'airports':1,'trains':1},
    'hungary': {'name':'Hungary','pop':10000,'military':1,'airports':1,'trains':1},
    'romania': {'name':'Romania','pop':19000,'military':1,'airports':1,'trains':1},
    'bulgaria': {'name':'Bulgaria','pop':7000,'military':1,'airports':1,'trains':1},
    'serbia': {'name':'Serbia','pop':8000,'military':1,'airports':1,'trains':1},
    'croatia': {'name':'Croatia','pop':4000,'military':1,'airports':1,'trains':1},
    'bosnia': {'name':'Bosnia & Herz.','pop':3000,'military':1,'airports':1,'trains':1},
    'albania': {'name':'Albania','pop':3000,'military':1,'airports':1,'trains':1},
    'north_macedonia': {'name':'North Macedonia','pop':2000,'military':1,'airports':1,'trains':1},
    'greece': {'name':'Greece','pop':16000,'military':1,'airports':1,'trains':1},
    'portugal': {'name':'Portugal','pop':10000,'military':1,'airports':1,'trains':1},
    'ireland': {'name':'Ireland','pop':5000,'military':1,'airports':1,'trains':1},
    'moldova': {'name':'Moldova','pop':2600,'military':1,'airports':1,'trains':1},
    'estonia': {'name':'Estonia','pop':1300,'military':1,'airports':1,'trains':1},
    'latvia': {'name':'Latvia','pop':1900,'military':1,'airports':1,'trains':1},
    'lithuania': {'name':'Lithuania','pop':2700,'military':1,'airports':1,'trains':1},
    'china': {'name':'China','pop':1400000,'military':10,'airports':5,'trains':5},
    'india': {'name':'India','pop':1380000,'military':10,'airports':5,'trains':5},
    'japan': {'name':'Japan','pop':125000,'military':3,'airports':3,'trains':3},
    'south_korea': {'name':'South Korea','pop':51000,'military':2,'airports':2,'trains':2},
    'north_korea': {'name':'North Korea','pop':25000,'military':3,'airports':1,'trains':1},
    'vietnam': {'name':'Vietnam','pop':97000,'military':2,'airports':1,'trains':1},
    'thailand': {'name':'Thailand','pop':69000,'military':2,'airports':1,'trains':1},
    'indonesia': {'name':'Indonesia','pop':273000,'military':5,'airports':4,'trains':3},
    'philippines': {'name':'Philippines','pop':109000,'military':2,'airports':2,'trains':1},
    'pakistan': {'name':'Pakistan','pop':220000,'military':4,'airports':2,'trains':2},
    'bangladesh': {'name':'Bangladesh','pop':164000,'military':2,'airports':1,'trains':1},
    'iran': {'name':'Iran','pop':83000,'military':3,'airports':2,'trains':2},
    'iraq': {'name':'Iraq','pop':40000,'military':2,'airports':1,'trains':1},
    'saudi_arabia': {'name':'Saudi Arabia','pop':34000,'military':3,'airports':2,'trains':1},
    'turkey': {'name':'Turkey','pop':84000,'military':3,'airports':2,'trains':2},
    'israel': {'name':'Israel','pop':9000,'military':2,'airports':1,'trains':1},
    'syria': {'name':'Syria','pop':17000,'military':1,'airports':1,'trains':1},
    'kazakhstan': {'name':'Kazakhstan','pop':19000,'military':2,'airports':1,'trains':1},
    'mongolia': {'name':'Mongolia','pop':3300,'military':1,'airports':1,'trains':1},
    'afghanistan': {'name':'Afghanistan','pop':38000,'military':1,'airports':1,'trains':1},
    'usa': {'name':'United States','pop':331000,'military':10,'airports':8,'trains':8},
    'canada': {'name':'Canada','pop':38000,'military':2,'airports':3,'trains':3},
    'mexico': {'name':'Mexico','pop':128000,'military':3,'airports':2,'trains':2},
    'brazil': {'name':'Brazil','pop':213000,'military':4,'airports':3,'trains':3},
    'argentina': {'name':'Argentina','pop':45000,'military':2,'airports':2,'trains':2},
    'colombia': {'name':'Colombia','pop':50000,'military':2,'airports':2,'trains':1},
    'peru': {'name':'Peru','pop':33000,'military':2,'airports':1,'trains':1},
    'chile': {'name':'Chile','pop':19000,'military':2,'airports':1,'trains':1},
    'venezuela': {'name':'Venezuela','pop':28000,'military':2,'airports':1,'trains':1},
    'cuba': {'name':'Cuba','pop':11000,'military':1,'airports':1,'trains':1},
    'egypt': {'name':'Egypt','pop':100000,'military':3,'airports':2,'trains':2},
    'nigeria': {'name':'Nigeria','pop':206000,'military':3,'airports':2,'trains':2},
    'south_africa': {'name':'South Africa','pop':59000,'military':2,'airports':2,'trains':2},
    'kenya': {'name':'Kenya','pop':53000,'military':2,'airports':1,'trains':1},
    'ethiopia': {'name':'Ethiopia','pop':115000,'military':2,'airports':1,'trains':1},
    'drc': {'name':'DR Congo','pop':89000,'military':2,'airports':1,'trains':1},
    'sudan': {'name':'Sudan','pop':43000,'military':2,'airports':1,'trains':1},
    'libya': {'name':'Libya','pop':6800,'military':1,'airports':1,'trains':1},
    'algeria': {'name':'Algeria','pop':44000,'military':2,'airports':1,'trains':1},
    'morocco': {'name':'Morocco','pop':37000,'military':2,'airports':1,'trains':1},
    'ghana': {'name':'Ghana','pop':31000,'military':1,'airports':1,'trains':1},
    'cameroon': {'name':'Cameroon','pop':26000,'military':1,'airports':1,'trains':1},
    'tanzania': {'name':'Tanzania','pop':60000,'military':2,'airports':1,'trains':1},
    'angola': {'name':'Angola','pop':32000,'military':2,'airports':1,'trains':1},
    'madagascar': {'name':'Madagascar','pop':28000,'military':1,'airports':1,'trains':1},
    'australia': {'name':'Australia','pop':25000,'military':2,'airports':3,'trains':2},
    'new_zealand': {'name':'New Zealand','pop':5000,'military':1,'airports':1,'trains':1},
    'papua_new_guinea': {'name':'Papua New Guinea','pop':9000,'military':1,'airports':1,'trains':1},
}

MARS_COUNTRY_DATA = {
    'olympus_imperium': {'name':'Olympus Imperium','pop':50000,'military':8,'airports':5,'trains':4},
    'tharsis_dominion': {'name':'Tharsis Dominion','pop':45000,'military':7,'airports':4,'trains':4},
    'elysium_collective': {'name':'Elysium Collective','pop':42000,'military':6,'airports':4,'trains':3},
    'vallis_marineris': {'name':'Vallis Marineris','pop':48000,'military':9,'airports':5,'trains':5},
    'noctis_labyrinth': {'name':'Noctis Labyrinth','pop':35000,'military':5,'airports':3,'trains':3},
    'arcadia_plains': {'name':'Arcadia Plains','pop':38000,'military':5,'airports':3,'trains':3},
    'utopia_basin': {'name':'Utopia Basin','pop':40000,'military':6,'airports':3,'trains':3},
    'amazonis_planitia': {'name':'Amazonis Planitia','pop':36000,'military':5,'airports':3,'trains':2},
    'candor_chasma': {'name':'Candor Chasma','pop':32000,'military':4,'airports':2,'trains':2},
    'melas_chasma': {'name':'Melas Chasma','pop':34000,'military':5,'airports':2,'trains':2},
    'ophir_chasma': {'name':'Ophir Chasma','pop':30000,'military':4,'airports':2,'trains':2},
    'coprates_chasma': {'name':'Coprates Chasma','pop':31000,'military':4,'airports':2,'trains':2},
    'sinai_planum': {'name':'Sinai Planum','pop':33000,'military':5,'airports':2,'trains':2},
    'solis_planum': {'name':'Solis Planum','pop':35000,'military':5,'airports':3,'trains':3},
    'lunae_planum': {'name':'Lunae Planum','pop':32000,'military':4,'airports':2,'trains':2},
    'daedalia_planum': {'name':'Daedalia Planum','pop':28000,'military':4,'airports':2,'trains':2},
    'tempe_terra': {'name':'Tempe Terra','pop':30000,'military':4,'airports':2,'trains':2},
    'alba_patera': {'name':'Alba Patera','pop':27000,'military':3,'airports':2,'trains':2},
    'isidis_planitia': {'name':'Isidis Planitia','pop':29000,'military':4,'airports':2,'trains':2},
    'nepenthes_mensae': {'name':'Nepenthes Mensae','pop':26000,'military':3,'airports':2,'trains':1},
    'tyrrhena_terra': {'name':'Tyrrhena Terra','pop':31000,'military':4,'airports':2,'trains':2},
    'hellas_basin': {'name':'Hellas Basin','pop':45000,'military':7,'airports':4,'trains':4},
    'hesperia_planum': {'name':'Hesperia Planum','pop':33000,'military':5,'airports':3,'trains':3},
    'promethei_terra': {'name':'Promethei Terra','pop':28000,'military':4,'airports':2,'trains':2},
    'malea_planum': {'name':'Malea Planum','pop':25000,'military':3,'airports':2,'trains':1},
    'australe_planum': {'name':'Australe Planum','pop':22000,'military':3,'airports':1,'trains':1},
    'sirenum_terra': {'name':'Sirenum Terra','pop':24000,'military':3,'airports':1,'trains':1},
    'phaethontis': {'name':'Phaethontis','pop':26000,'military':3,'airports':2,'trains':1},
    'aonia_terra': {'name':'Aonia Terra','pop':23000,'military':3,'airports':1,'trains':1},
    'cimmeria_terra': {'name':'Cimmeria Terra','pop':27000,'military':4,'airports':2,'trains':2},
    'aeolis_dorsa': {'name':'Aeolis Dorsa','pop':29000,'military':4,'airports':2,'trains':2},
    'elysium_mons': {'name':'Elysium Mons','pop':38000,'military':6,'airports':3,'trains':3},
    'tharsis_tholus': {'name':'Tharsis Tholus','pop':25000,'military':3,'airports':2,'trains':1},
    'ascraeus_mons': {'name':'Ascraeus Mons','pop':35000,'military':5,'airports':3,'trains':3},
    'pavonis_mons': {'name':'Pavonis Mons','pop':36000,'military':5,'airports':3,'trains':3},
    'arsia_mons': {'name':'Arsia Mons','pop':34000,'military':5,'airports':3,'trains':2},
    'capri_chasma': {'name':'Capri Chasma','pop':24000,'military':3,'airports':1,'trains':1},
    'aurorae_chaos': {'name':'Aurorae Chaos','pop':22000,'military':3,'airports':1,'trains':1},
    'juventae_chasma': {'name':'Juventae Chasma','pop':26000,'military':3,'airports':2,'trains':1},
    'xanthe_terra': {'name':'Xanthe Terra','pop':28000,'military':4,'airports':2,'trains':2},
    'chryse_planitia': {'name':'Chryse Planitia','pop':30000,'military':4,'airports':2,'trains':2},
    'acidalia_planitia': {'name':'Acidalia Planitia','pop':32000,'military':4,'airports':2,'trains':2},
    'new_marineris': {'name':'New Marineris','pop':40000,'military':6,'airports':3,'trains':3},
    'olympus_outpost': {'name':'Olympus Outpost','pop':42000,'military':6,'airports':3,'trains':3},
    'red_tharsis': {'name':'Red Tharsis','pop':38000,'military':5,'airports':3,'trains':2},
    'hellas_rim': {'name':'Hellas Rim','pop':32000,'military':4,'airports':2,'trains':2},
    'polar_cap_north': {'name':'Polar Cap North','pop':20000,'military':3,'airports':1,'trains':1},
    'polar_cap_south': {'name':'Polar Cap South','pop':18000,'military':2,'airports':1,'trains':1},
    'gale_crater': {'name':'Gale Crater','pop':28000,'military':4,'airports':2,'trains':2},
    'spirit_plains': {'name':'Spirit Plains','pop':25000,'military':3,'airports':2,'trains':1},
}


def format_paths_js(paths_dict, export_name):
    """Format paths dict as JS module"""
    lines = [f"export const {export_name} = {{"]
    for tid, path in paths_dict.items():
        lines.append(f'    {tid}: "{path}",')
    lines.append("};")
    return "\n".join(lines)


def format_countries_js(countries_dict, adjacency, world):
    """Format countries dict as JS module with adjacency"""
    lines = [f"export const {'countries' if world == 'earth' else 'marsCountries'} = {{"]
    for tid, data in countries_dict.items():
        adj = sorted(adjacency.get(tid, set()))
        adj_str = json.dumps(adj)
        lines.append(f'    {tid}: {{ name:"{data["name"]}", pop:{data["pop"]}, level:1, owner:"ai", military:{data["military"]}, airports:{data["airports"]}, trains:{data["trains"]}, adjacent:{adj_str}, world:"{world}" }},')
    lines.append("};")
    return "\n".join(lines)


# ─── Main ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Generate Earth
    earth_paths, earth_adj, earth_vb, earth_pos = generate_map_data(
        EARTH_CONTINENTS, EARTH_CROSS_ADJACENCY, EARTH_COUNTRY_DATA
    )
    
    # Generate Mars
    mars_paths, mars_adj, mars_vb, mars_pos = generate_map_data(
        MARS_CONTINENTS, MARS_CROSS_ADJACENCY, MARS_COUNTRY_DATA
    )
    
    # Output paths JS
    print("=== countryPaths.js ===")
    print(format_paths_js(earth_paths, "countryPaths"))
    print()
    
    print("=== marsPaths.js ===")
    print(format_paths_js(mars_paths, "marsCountryPaths"))
    print()
    
    print("=== countries.js ===")
    print(format_countries_js(EARTH_COUNTRY_DATA, earth_adj, "earth"))
    print()
    
    print("=== marsCountries.js ===")
    print(format_countries_js(MARS_COUNTRY_DATA, mars_adj, "mars"))
    print()
    
    print("=== ViewBox Settings ===")
    print(f"Earth: {earth_vb}")
    print(f"Mars: {mars_vb}")
    print()
    
    print(f"Earth territories: {len(earth_paths)}")
    print(f"Mars territories: {len(mars_paths)}")
    
    # Verify all countries have paths and adjacency
    for tid in EARTH_COUNTRY_DATA:
        if tid not in earth_paths:
            print(f"WARNING: Earth territory '{tid}' has no path!")
        if not earth_adj.get(tid):
            print(f"WARNING: Earth territory '{tid}' has no adjacency!")
    
    for tid in MARS_COUNTRY_DATA:
        if tid not in mars_paths:
            print(f"WARNING: Mars territory '{tid}' has no path!")
        if not mars_adj.get(tid):
            print(f"WARNING: Mars territory '{tid}' has no adjacency!")
