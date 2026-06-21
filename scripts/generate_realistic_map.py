#!/usr/bin/env python3
"""
Generate realistic country border SVG paths for WarXOne game map.

Uses Natural Earth 110m (public domain) geographic data.
Downloads SHP data, converts to SVG path strings with Douglas-Peucker simplification.
"""

import json
import math
import os
import re
import sys
import urllib.request
import zipfile
import io
import tempfile
import shapefile

# ============================================================
# Game territory list — Earth territories with ISO A2 codes
# for matching to Natural Earth data
# ============================================================

EARTH_TERRITORIES = {
    # North America
    "canada":        {"name": "Canada",       "iso": "CA"},
    "usa":           {"name": "United States",  "iso": "US"},
    "mexico":        {"name": "Mexico",         "iso": "MX"},
    "cuba":          {"name": "Cuba",           "iso": "CU"},

    # South America
    "colombia":      {"name": "Colombia",       "iso": "CO"},
    "venezuela":     {"name": "Venezuela",      "iso": "VE"},
    "peru":          {"name": "Peru",            "iso": "PE"},
    "brazil":        {"name": "Brazil",          "iso": "BR"},
    "chile":         {"name": "Chile",           "iso": "CL"},
    "argentina":     {"name": "Argentina",       "iso": "AR"},

    # Europe - West/North
    "norway":        {"name": "Norway",          "iso": "NO"},
    "sweden":        {"name": "Sweden",          "iso": "SE"},
    "finland":       {"name": "Finland",         "iso": "FI"},
    "ireland":       {"name": "Ireland",         "iso": "IE"},
    "uk":            {"name": "U.K.",            "iso": "GB"},
    "denmark":       {"name": "Denmark",         "iso": "DK"},
    "portugal":      {"name": "Portugal",        "iso": "PT"},
    "netherlands":   {"name": "Netherlands",     "iso": "NL"},
    "belgium":       {"name": "Belgium",         "iso": "BE"},
    "spain":         {"name": "Spain",           "iso": "ES"},
    "france":        {"name": "France",          "iso": "FR"},
    "switzerland":   {"name": "Switzerland",     "iso": "CH"},
    "italy":         {"name": "Italy",           "iso": "IT"},
    "germany":       {"name": "Germany",         "iso": "DE"},
    "czech":         {"name": "Czechia",         "iso": "CZ"},
    "austria":       {"name": "Austria",         "iso": "AT"},
    "slovakia":      {"name": "Slovakia",        "iso": "SK"},
    "poland":        {"name": "Poland",          "iso": "PL"},
    "hungary":       {"name": "Hungary",         "iso": "HU"},

    # Europe - East & Balkans
    "romania":       {"name": "Romania",         "iso": "RO"},
    "bulgaria":      {"name": "Bulgaria",        "iso": "BG"},
    "greece":        {"name": "Greece",          "iso": "GR"},
    "serbia":        {"name": "Serbia",          "iso": "RS"},
    "croatia":       {"name": "Croatia",         "iso": "HR"},
    "ukraine":       {"name": "Ukraine",         "iso": "UA"},
    "turkey":        {"name": "Turkey",          "iso": "TR"},
    "estonia":       {"name": "Estonia",         "iso": "EE"},
    "latvia":        {"name": "Latvia",          "iso": "LV"},
    "lithuania":     {"name": "Lithuania",       "iso": "LT"},
    "moldova":       {"name": "Moldova",         "iso": "MD"},

    # Asia - Central/West
    "kazakhstan":    {"name": "Kazakhstan",      "iso": "KZ"},
    "iran":          {"name": "Iran",            "iso": "IR"},
    "iraq":          {"name": "Iraq",            "iso": "IQ"},
    "saudi":         {"name": "Saudi Arabia",    "iso": "SA"},
    "afghanistan":   {"name": "Afghanistan",     "iso": "AF"},

    # Asia - East/South
    "india":         {"name": "India",           "iso": "IN"},
    "pakistan":      {"name": "Pakistan",        "iso": "PK"},
    "china":         {"name": "China",           "iso": "CN"},
    "mongolia":      {"name": "Mongolia",        "iso": "MN"},
    "north_korea":   {"name": "N. Korea",        "iso": "KP"},
    "south_korea":   {"name": "S. Korea",        "iso": "KR"},
    "japan":         {"name": "Japan",           "iso": "JP"},
    "vietnam":       {"name": "Vietnam",         "iso": "VN"},
    "thailand":      {"name": "Thailand",        "iso": "TH"},
    "indonesia":     {"name": "Indonesia",       "iso": "ID"},
    "philippines":   {"name": "Philippines",     "iso": "PH"},
    "malaysia":      {"name": "Malaysia",        "iso": "MY"},
    "myanmar":       {"name": "Myanmar",         "iso": "MM"},
    "bangladesh":    {"name": "Bangladesh",      "iso": "BD"},

    # Africa - North
    "egypt":         {"name": "Egypt",           "iso": "EG"},
    "libya":         {"name": "Libya",           "iso": "LY"},
    "algeria":       {"name": "Algeria",         "iso": "DZ"},
    "morocco":       {"name": "Morocco",         "iso": "MA"},

    # Africa - Central/South/East
    "nigeria":       {"name": "Nigeria",         "iso": "NG"},
    "ethiopia":      {"name": "Ethiopia",        "iso": "ET"},
    "kenya":         {"name": "Kenya",           "iso": "KE"},
    "dr_congo":      {"name": "D.R. Congo",      "iso": "CD"},
    "south_africa":  {"name": "S. Africa",       "iso": "ZA"},
    "angola":        {"name": "Angola",          "iso": "AO"},
    "sudan":         {"name": "Sudan",           "iso": "SD"},

    # Oceania
    "australia":     {"name": "Australia",       "iso": "AU"},
    "new_zealand":   {"name": "New Zealand",    "iso": "NZ"},

    # Additional
    "bolivia":       {"name": "Bolivia",         "iso": "BO"},
    "ecuador":       {"name": "Ecuador",         "iso": "EC"},
    "paraguay":      {"name": "Paraguay",        "iso": "PY"},
    "uruguay":       {"name": "Uruguay",         "iso": "UY"},
}


def download_natural_earth(cache_dir="cache"):
    """Download and return Natural Earth shapefile reader."""
    os.makedirs(cache_dir, exist_ok=True)
    shp_path = os.path.join(cache_dir, "ne_110m_admin_0_countries")

    # Check if already extracted
    if os.path.exists(shp_path + ".shp"):
        print(f"Using cached: {shp_path}.shp")
        return shapefile.Reader(shp_path)

    url = "https://naciscdn.org/naturalearth/110m/cultural/ne_110m_admin_0_countries.zip"
    print(f"Downloading Natural Earth 110m from {url}...")
    resp = urllib.request.urlopen(url, timeout=60)
    zip_data = io.BytesIO(resp.read())

    tmpdir = tempfile.mkdtemp()
    with zipfile.ZipFile(zip_data) as zf:
        zf.extractall(tmpdir)
        print(f"Extracted {len(zf.namelist())} files")

    # Copy to cache dir
    src = os.path.join(tmpdir, "ne_110m_admin_0_countries")
    for ext in [".shp", ".dbf", ".prj", ".shx", ".cpg"]:
        s = src + ext
        d = shp_path + ext
        if os.path.exists(s):
            import shutil
            shutil.copy2(s, d)

    print(f"Saved to cache: {shp_path}.shp")
    return shapefile.Reader(shp_path)


def simplify_ring(coords, tolerance=0.4):
    """Douglas-Peucker line simplification."""
    if len(coords) <= 3:
        return coords

    def perp_dist(p1, p2, p):
        dx, dy = p2[0] - p1[0], p2[1] - p1[1]
        length_sq = dx * dx + dy * dy
        if length_sq == 0:
            return math.hypot(p[0] - p1[0], p[1] - p1[1])
        t = max(0, min(1, ((p[0] - p1[0]) * dx + (p[1] - p1[1]) * dy) / length_sq))
        proj_x = p1[0] + t * dx
        proj_y = p1[1] + t * dy
        return math.hypot(p[0] - proj_x, p[1] - proj_y)

    # Find farthest point
    first, last = coords[0], coords[-1]
    max_d = 0
    max_idx = 0
    for i in range(1, len(coords) - 1):
        d = perp_dist(first, last, coords[i])
        if d > max_d:
            max_d = d
            max_idx = i

    if max_d > tolerance:
        left = simplify_ring(coords[:max_idx + 1], tolerance)
        right = simplify_ring(coords[max_idx:], tolerance)
        return left[:-1] + right
    else:
        return [first, last]


def shape_to_svg_path(sf_shape, scale_x, scale_y, offset_x, offset_y, tolerance=0.35):
    """Convert a shapefile polygon shape to SVG path d string."""
    points = sf_shape.points
    parts = list(sf_shape.parts) + [len(points)]

    parts_list = []
    for i in range(len(parts) - 1):
        ring = points[parts[i]:parts[i + 1]]
        if len(ring) < 3:
            continue
        simplified = simplify_ring(ring, tolerance)
        # Ensure closed
        if simplified and simplified[0] != simplified[-1]:
            simplified.append(simplified[0])

        cmds = []
        for j, (lon, lat) in enumerate(simplified):
            x = (lon + 180) * scale_x + offset_x
            y = (90 - lat) * scale_y + offset_y  # Flip Y: north up
            if j == 0:
                cmds.append(f"M {x:.1f},{y:.1f}")
            elif j == 1:
                cmds.append(f"L {x:.1f},{y:.1f}")
            else:
                cmds.append(f"{x:.1f},{y:.1f}")

        if cmds:
            cmds.append("Z")
            parts_list.append(" ".join(cmds))

    return " ".join(parts_list)


def match_country(record, field_names, info):
    """Try to match a shapefile record to a game territory by name/ISO."""
    rec_dict = dict(zip(field_names, record))
    iso_a2 = str(rec_dict.get("ISO_A2", "")).upper()
    adm0_a3 = str(rec_dict.get("ADM0_A3", "")).upper()
    name_en = str(rec_dict.get("NAME", "")).upper()
    name_long = str(rec_dict.get("NAME_LONG", "")).upper()

    target_iso = info["iso"].upper()
    target_name = info["name"].upper()

    # Direct ISO match
    if iso_a2 == target_iso and iso_a2 != "-99":
        return True, f"ISO:{target_iso}"

    # ADM0_A3 match
    if adm0_a3 == target_iso and adm0_a3 != "-99":
        return True, f"A3:{adm0_a3}"

    # Name match
    if target_name in name_en or target_name in name_long:
        return True, f"NAME:{rec_dict.get('NAME', '')}"

    # Partial name match (first 4 chars)
    if len(target_name) >= 4:
        prefix = target_name[:4]
        if prefix in name_en[:8]:
            return True, f"PARTIAL:{rec_dict.get('NAME', '')}"
        if prefix in name_long[:12]:
            return True, f"LONG:{rec_dict.get('NAME_LONG', '')}"

    return False, None


def generate_earth_paths(sf, output_dir):
    """Generate country paths from Natural Earth data."""

    records = sf.records()
    shapes = sf.shapes()
    n_records = len(records)
    print(f"\nNatural Earth: {n_records} features loaded")

    # Build field name list
    field_names = [f[0] for f in sf.fields[1:]]

    # === Phase 1: Build lookup tables from Natural Earth data ===
    iso_a2_lookup = {}   # ISO_A2 uppercase -> idx
    adm0_a3_lookup = {}  # ADM0_A3 uppercase -> idx
    name_lookup = {}     # NAME uppercase -> idx
    name_long_lookup = {}# NAME_LONG uppercase -> [idxs]

    for idx in range(n_records):
        rd = dict(zip(field_names, records[idx]))
        iso = str(rd.get("ISO_A2", "")).upper()
        a3 = str(rd.get("ADM0_A3", "")).upper()
        nm = str(rd.get("NAME", "")).upper()
        nml = str(rd.get("NAME_LONG", "")).upper()

        if iso and iso != "-99":
            iso_a2_lookup[iso] = idx
        if a3 and a3 != "-99":
            adm0_a3_lookup[a3] = idx
        if nm:
            name_lookup[nm] = idx
        if nml:
            name_long_lookup.setdefault(nml, []).append(idx)

    print(f"Lookup tables: {len(iso_a2_lookup)} ISO, {len(name_lookup)} names")

    # === Phase 2: Match game territories (ISO-first strategy) ===
    matched = {}
    unmatched = []

    for tid, info in EARTH_TERRITORIES.items():
        target_iso = info["iso"].upper()
        target_name = info["name"].upper()
        found_idx = None

        # Priority 1: Exact ISO_A2 match
        if target_iso in iso_a2_lookup:
            found_idx = iso_a2_lookup[target_iso]

        # Priority 2: ADM0_A3 match
        if found_idx is None and target_iso in adm0_a3_lookup:
            found_idx = adm0_a3_lookup[target_iso]

        # Priority 3: Exact NAME match
        if found_idx is None and target_name in name_lookup:
            found_idx = name_lookup[target_name]

        # Priority 4: NAME_LONG exact match
        if found_idx is None and target_name in name_long_lookup:
            found_idx = name_long_lookup[target_name][0]

        # Priority 5: Name contains match (target_name inside NE name) — strict
        if found_idx is None:
            for ne_name, idx in name_lookup.items():
                if len(target_name) >= 4 and target_name == ne_name[:len(target_name)]:
                    # NE name starts with our target — good enough for short forms
                    found_idx = idx
                    break

        if found_idx is not None:
            matched[tid] = found_idx
        else:
            unmatched.append((tid, info))

    print(f"Matched: {len(matched)}/{len(EARTH_TERRITORIES)} territories")
    if unmatched:
        print(f"Unmatched ({len(unmatched)}):")
        for tid, info in unmatched:
            print(f"  - {tid}: {info['name']} ({info['iso']})")
            # Show closest name matches
            for idx in range(min(n_records, 50)):
                r = records[idx]
                rd = dict(zip(field_names, r))
                nm = str(rd.get("NAME", ""))
                iso = str(rd.get("ISO_A2", ""))
                if info["iso"][:2].upper() in nm.upper()[:6] or info["name"][:3].upper() in nm.upper()[:6]:
                    print(f"    -> possible: {nm} (ISO={iso})")

    # Compute bounding box of matched features
    min_lon, min_lat = 180, 90
    max_lon, max_lat = -180, -90

    matched_indices = set(matched.values())
    for idx in sorted(matched_indices):
        s = shapes[idx]
        bbox = s.bbox  # [minx, miny, maxx, maxy] in lon/lat
        min_lon = min(min_lon, bbox[0])
        min_lat = min(min_lat, bbox[1])
        max_lon = max(max_lon, bbox[2])
        max_lat = max(max_lat, bbox[3])

    print(f"Bounds (lon/lat): [{min_lon},{min_lat}] to [{max_lon},{max_lat}]")

    # Add padding
    pad_lon = (max_lon - min_lon) * 0.03
    pad_lat = (max_lat - min_lat) * 0.03
    min_lon -= pad_lon; max_lon += pad_lon
    min_lat -= pad_lat; max_lat += pad_lat

    # Target SVG dimensions
    svg_w = int((max_lon - min_lon) / 360.0 * 2200)
    svg_h = int(svg_w * ((max_lat - min_lat) / (max_lon - min_lon)))

    # Scale factors
    scale_x = svg_w / (max_lon - min_lon)
    scale_y = svg_h / (max_lat - min_lat)
    offset_x = -min_lon * scale_x
    offset_y = -min_lat * scale_y

    print(f"SVG ViewBox: 0 0 {svg_w} {svg_h}")

    # Generate paths
    paths = {}
    bboxes = {}

    for tid, feat_idx in matched.items():
        s = shapes[feat_idx]
        path_d = shape_to_svg_path(s, scale_x, scale_y, offset_x, offset_y, tolerance=0.30)
        if path_d:
            paths[tid] = path_d
            bboxes[tid] = s.bbox

    print(f"Generated {len(paths)} SVG paths")

    # Compute adjacency from bounding box proximity
    adjacencies = {}
    threshold = 4.0  # degrees - generous for approximate adjacency
    tids = list(paths.keys())
    for i, tid1 in enumerate(tids):
        bb1 = bboxes.get(tid1, (999, 999, -999, -999))
        neighbors = []
        for j in range(i + 1, len(tids)):
            tid2 = tids[j]
            bb2 = bboxes.get(tid2, (999, 999, -999, -999))
            gap = max(bb1[0] - bb2[2], bb2[0] - bb1[2],
                     bb1[1] - bb2[3], bb2[1] - bb1[3])
            if gap < threshold:
                neighbors.append(tid2)
                if tid2 not in adjacencies:
                    adjacencies[tid2] = []
                if tid1 not in adjacencies[tid2]:
                    adjacencies[tid2].append(tid1)
        if neighbors:
            adjacencies[tid1] = neighbors

    return {
        "paths": paths,
        "adjacencies": adjacencies,
        "viewBox": (svg_w, svg_h),
        "unmatched": unmatched,
    }


# ============================================================
# Mars territories — stylized organic shapes inspired by
# real Martian geography (Tharsis, Valles Marineris, Hellas, etc.)
# Uses quadratic Bezier curves for natural-looking coastlines.
# ============================================================

MARS_SHAPES = {
    # === Tharsis Volcanic Province ===
    "olympus_mons":
        "M 280,120 Q 320,95 365,108 Q 402,128 392,170 Q 372,210 325,205 Q 275,192 258,158 Q 248,135 Z",
    "arsia_mons":
        "M 225,175 Q 265,155 300,172 Q 328,195 310,225 Q 280,242 245,222 Q 218,198 Z",
    "pavonis_mons":
        "M 298,228 Q 340,208 375,226 Q 400,252 380,282 Q 344,298 305,275 Q 280,250 Z",
    "ascraeus_mons":
        "M 368,142 Q 410,120 452,140 Q 482,168 468,205 Q 438,228 398,202 Q 370,172 Z",
    "tharsis_ridge":
        "M 235,138 Q 290,118 350,132 Q 410,152 432,195 Q 442,245 415,285 Q 378,315 322,302 Q 268,285 238,245 Q 212,200 228,162 Z",

    # === Chryse/Acidalia Region ===
    "marineris_valles":
        "M 420,242 Q 480,215 550,238 Q 612,268 628,315 Q 625,362 578,385 Q 520,402 465,378 Q 418,348 408,302 Q 402,268 Z",
    "chryse_planitia":
        "M 495,182 Q 555,160 618,182 Q 668,215 678,265 Q 668,312 615,332 Q 555,345 498,318 Q 458,285 468,232 Z",
    "lunae_palus":
        "M 552,148 Q 610,125 668,148 Q 718,178 728,225 Q 718,270 665,292 Q 605,305 552,278 Q 512,248 525,195 Z",
    "acidalia_planitia":
        "M 618,88 Q 685,62 758,85 Q 822,122 842,178 Q 838,235 778,265 Q 708,285 642,255 Q 592,218 602,158 Z",
    "utydor_planitia":
        "M 725,155 Q 788,128 848,158 Q 898,195 905,248 Q 892,298 832,322 Q 762,338 702,308 Q 658,272 672,212 Z",
    "isidis_planitia":
        "M 752,245 Q 815,218 875,248 Q 922,285 932,338 Q 918,388 858,408 Q 792,418 742,388 Q 702,352 715,292 Z",

    # === Elysium Region ===
    "elysium_mons":
        "M 862,102 Q 912,75 962,100 Q 1002,135 1012,185 Q 998,235 948,258 Q 892,272 845,245 Q 812,205 828,155 Z",
    "hecates_tholus":
        "M 818,48 Q 865,28 908,50 Q 938,78 944,118 Q 932,158 888,172 Q 838,180 808,155 Q 788,125 798,82 Z",
    "albor_tholus":
        "M 948,138 Q 988,118 1028,142 Q 1055,172 1052,208 Q 1040,245 998,258 Q 952,265 920,240 Q 898,212 908,172 Z",
    "elysium_planitia":
        "M 878,198 Q 938,172 998,202 Q 1048,238 1058,288 Q 1042,338 985,362 Q 918,378 868,348 Q 835,312 848,258 Z",
    "utopia_planitia":
        "M 942,38 Q 1018,10 1095,48 Q 1162,92 1188,152 Q 1182,212 1118,248 Q 1042,272 968,242 Q 912,208 918,148 Z",

    # === Eastern Chaos ===
    "valles_marineris_east":
        "M 582,302 Q 645,278 712,305 Q 768,338 782,392 Q 768,445 712,468 Q 645,485 585,455 Q 545,418 558,362 Z",
    "chaos_region":
        "M 655,362 Q 712,338 772,368 Q 822,405 835,458 Q 818,508 765,528 Q 702,542 650,512 Q 612,478 628,418 Z",
    "capri_chaos":
        "M 728,428 Q 785,405 842,432 Q 888,468 898,518 Q 882,568 825,588 Q 762,600 712,572 Q 678,538 692,478 Z",
    "eos_chasma":
        "M 798,502 Q 855,478 912,508 Q 958,545 968,595 Q 950,645 892,665 Q 828,678 778,648 Q 745,610 762,548 Z",

    # === Hellas Basin Region ===
    "hellas_basin":
        "M 515,518 Q 588,482 662,522 Q 725,572 742,638 Q 722,708 655,745 Q 578,772 508,738 Q 468,692 482,625 Q 492,562 Z",
    "hellespontus":
        "M 458,472 Q 505,448 552,475 Q 588,508 595,552 Q 578,598 535,615 Q 485,625 452,595 Q 428,562 438,512 Z",
    "tyrrhenus":
        "M 392,535 Q 438,508 485,538 Q 518,572 525,618 Q 508,662 462,682 Q 412,695 378,665 Q 352,632 365,578 Z",
    "hadriacus":
        "M 565,642 Q 615,615 668,648 Q 708,685 715,735 Q 695,785 642,808 Q 578,825 528,792 Q 495,755 512,692 Z",
    "promethei":
        "M 668,592 Q 715,565 765,598 Q 802,632 810,678 Q 792,725 738,742 Q 678,755 632,725 Q 602,688 615,628 Z",

    # === Southern Highlands ===
    "argyre_basin":
        "M 322,648 Q 378,618 438,655 Q 485,698 495,758 Q 478,818 415,845 Q 348,862 305,828 Q 275,788 288,720 Z",
    "aonia":
        "M 255,678 Q 302,652 348,682 Q 382,715 388,762 Q 372,808 325,825 Q 275,835 242,805 Q 218,772 228,715 Z",
    "thaumasia":
        "M 378,732 Q 428,705 478,742 Q 515,778 522,828 Q 502,878 448,900 Q 388,915 348,882 Q 318,845 335,778 Z",
    "solis_planum":
        "M 288,482 Q 338,458 388,488 Q 422,522 428,568 Q 412,612 362,632 Q 308,645 278,612 Q 255,575 268,518 Z",
    "coronae":
        "M 205,562 Q 252,538 298,568 Q 332,602 338,648 Q 322,692 272,712 Q 222,722 192,692 Q 168,658 178,602 Z",
    "noachis":
        "M 442,782 Q 492,755 545,792 Q 585,832 592,882 Q 572,932 515,955 Q 452,972 408,938 Q 378,898 395,832 Z",
    "hellas_outlier":
        "M 608,752 Q 655,725 708,758 Q 748,795 758,848 Q 738,898 682,918 Q 622,932 578,902 Q 548,865 565,798 Z",
    "australis":
        "M 475,862 Q 522,835 575,872 Q 612,908 622,958 Q 598,1008 545,1032 Q 482,1048 445,1015 Q 418,978 432,912 Z",

    # === North Polar Region ===
    "north_polar_cap":
        "M 615,-12 Q 705,-42 798,-5 Q 872,42 908,108 Q 912,172 858,222 Q 788,252 718,225 Q 655,188 642,135 Z",
    "borealis_plain":
        "M 785,12 Q 868,-18 955,22 Q 1028,72 1062,138 Q 1072,208 1008,258 Q 932,285 868,252 Q 808,215 795,158 Z",
    "vastitas_borealis_w":
        "M 902,-8 Q 978,-38 1062,5 Q 1135,52 1172,118 Q 1182,188 1118,238 Q 1042,265 968,232 Q 905,195 918,132 Z",
    "vastitas_borealis_e":
        "M 1082,32 Q 1158,2 1238,42 Q 1305,88 1342,155 Q 1348,225 1278,275 Q 1195,302 1125,268 Q 1065,232 1078,165 Z",
    "arcadia_planitia":
        "M 985,178 Q 1058,150 1128,185 Q 1185,228 1198,285 Q 1182,342 1112,368 Q 1032,385 968,352 Q 922,312 938,245 Z",
    "diacria":
        "M 832,15 Q 888,-8 938,22 Q 972,58 978,102 Q 962,145 918,162 Q 868,172 832,145 Q 808,112 818,62 Z",

    # === South Polar Region ===
    "south_polar_cap":
        "M 478,922 Q 545,892 618,932 Q 678,978 698,1042 Q 678,1108 618,1142 Q 545,1165 490,1128 Q 458,1088 472,1015 Z",
    "australis_south":
        "M 585,918 Q 648,888 712,928 Q 762,972 782,1035 Q 758,1098 695,1132 Q 628,1155 575,1118 Q 542,1078 558,1002 Z",
    "mare_south":
        "M 382,888 Q 435,862 488,895 Q 522,932 532,985 Q 508,1038 452,1058 Q 395,1072 358,1038 Q 332,1002 345,935 Z",
}

MARS_INFO = {
    "olympus_mons": {"name":"Olympus Mons","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "arsia_mons": {"name":"Arsia Mons","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "pavonis_mons": {"name":"Pavonis Mons","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "ascraeus_mons": {"name":"Ascraeus Mons","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "tharsis_ridge": {"name":"Tharsis Ridge","pop":0,"level":2,"military":2,"airports":1,"trains":0},
    "marineris_valles": {"name":"Valles Marineris","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "chryse_planitia": {"name":"Chryse Planitia","pop":0,"level":1,"military":1,"airports":1,"trains":0},
    "lunae_palus": {"name":"Lunae Palus","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "acidalia_planitia": {"name":"Acidalia Planitia","pop":0,"level":1,"military":1,"airports":1,"trains":0},
    "utydor_planitia": {"name":"Utopia Planitia E","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "isidis_planitia": {"name":"Isidis Planitia","pop":0,"level":1,"military":1,"airports":1,"trains":0},
    "elysium_mons": {"name":"Elysium Mons","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "hecates_tholus": {"name":"Hecates Tholus","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "albor_tholus": {"name":"Albor Tholus","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "elysium_planitia": {"name":"Elysium Planitia","pop":0,"level":1,"military":1,"airports":1,"trains":0},
    "utopia_planitia": {"name":"Utopia Planitia","pop":0,"level":1,"military":2,"airports":1,"trains":0},
    "valles_marineris_east": {"name":"VM East","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "chaos_region": {"name":"Chaos Region","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "capri_chaos": {"name":"Capri Chaos","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "eos_chasma": {"name":"Eos Chasma","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "hellas_basin": {"name":"Hellas Basin","pop":0,"level":2,"military":2,"airports":1,"trains":0},
    "hellespontus": {"name":"Hellespontus","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "tyrrhenus": {"name":"Tyrrhenus","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "hadriacus": {"name":"Hadriacus","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "promethei": {"name":"Promethei","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "argyre_basin": {"name":"Argyre Basin","pop":0,"level":1,"military":1,"airports":1,"trains":0},
    "aonia": {"name":"Aonia","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "thaumasia": {"name":"Thaumasia","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "solis_planum": {"name":"Solis Planum","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "coronae": {"name":"Coronae","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "noachis": {"name":"Noachis","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "hellas_outlier": {"name":"Hellas Outlier","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "australis": {"name":"Australis S","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "north_polar_cap": {"name":"N. Polar Cap","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "borealis_plain": {"name":"Borealis Plain","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "vastitas_borealis_w": {"name":"Vastitas B W","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "vastitas_borealis_e": {"name":"Vastitas B E","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "arcadia_planitia": {"name":"Arcadia Planitia","pop":0,"level":1,"military":1,"airports":1,"trains":0},
    "diacria": {"name":"Diacria","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "south_polar_cap": {"name":"S. Polar Cap","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "australis_south": {"name":"Australis Far","pop":0,"level":1,"military":1,"airports":0,"trains":0},
    "mare_south": {"name":"Mare S","pop":0,"level":1,"military":1,"airports":0,"trains":0},
}


def generate_mars_paths():
    """Generate stylized Mars territory paths with adjacency."""

    # Compute centers for each region (for adjacency detection)
    centers = {}
    for tid, d in MARS_SHAPES.items():
        nums = [float(x) for x in re.findall(r'[\d.]+', d)]
        xs = [nums[i] for i in range(0, len(nums), 2)]
        ys = [nums[i] for i in range(1, len(nums), 2)]
        centers[tid] = (sum(xs)/len(xs), sum(ys)/len(ys)) if xs else (0, 0)

    # Compute adjacency based on center distance
    mars_adj = {}
    tids = list(MARS_SHAPES.keys())
    for i, tid1 in enumerate(tids):
        c1 = centers.get(tid1, (0, 0))
        neighbors = []
        for j in range(i+1, len(tids)):
            tid2 = tids[j]
            c2 = centers.get(tid2, (0, 0))
            dist = math.hypot(c1[0]-c2[0], c1[1]-c2[1])
            if dist < 135:  # Adjacency threshold
                neighbors.append(tid2)
                if tid2 not in mars_adj:
                    mars_adj[tid2] = []
                if tid1 not in mars_adj[tid2]:
                    mars_adj[tid2].append(tid1)
        if neighbors:
            mars_adj[tid1] = neighbors

    # Compute viewBox
    all_nums = []
    for d in MARS_SHAPES.values():
        nums = [float(x) for x in re.findall(r'[\d.]+', d)]
        all_nums.extend(nums)
    if all_nums:
        xs = [all_nums[i] for i in range(0, len(all_nums), 2)]
        ys = [all_nums[i] for i in range(1, len(all_nums), 2)]
        vw = int(max(xs) - min(xs) + 40) | 1
        vh = int(max(ys) - min(ys) + 40) | 1
    else:
        vw, vh = 1400, 1250

    return {
        "paths": MARS_SHAPES,
        "adjacencies": mars_adj,
        "viewBox": (vw, vh),
    }


# ============================================================
# Population/military data helpers
# ============================================================
_POP = {
    "China":1440000,"India":1400000,"United States":331000,"Indonesia":273000,
    "Pakistan":220000,"Brazil":212000,"Nigeria":206000,"Bangladesh":164000,
    "Russia":144000,"Japan":126000,"Ethiopia":115000,"Vietnam":97000,
    "Egypt":102000,"Iran":84000,"Turkey":84000,"Germany":83000,
    "France":67000,"U.K.":67000,"Thailand":70000,"Italy":60000,
    "South Africa":59000,"Tanzania":59000,"Myanmar":54000,"South Korea":51000,
    "Colombia":50800,"Kenya":53000,"Ukraine":44000,"Argentina":45000,
    "Algeria":43000,"Sudan":43800,"Morocco":36000,"Uzbekistan":33000,
    "Peru":32500,"Afghanistan":38000,"Malaysia":32000,"Australia":25000,
    "Saudi Arabia":34800,"Poland":37000,"Canada":38000,"Angola":32000,
    "Uganda":41000,"Iraq":40000,"Netherlands":17000,"Nigeria":206000,
    "D.R. Congo":89000,"Philippines":109000,"Ecuador":17600,"Ghana":31000,
    "Mozambique":31000,"Spain":47000,"Sweden":10000,"Greece":104000,
    "Portugal":10000,"Belgium":11000,"Czechia":10000,"Austria":9000,
    "Switzerland":8000,"Denmark":5800,"Norway":14000,"Finland":5500,
    "Ireland":4900,"Bulgaria":6900,"Croatia":4100,"Slovakia":5400,
    "Hungary":9600,"Romania":19200,"Serbia":8700,"Lithuania":2800,
    "Latvia":1900,"Estonia":1300,"Moldova":2600,"Cuba":11300,
    "Venezuela":28400,"Chile":19100,"Bolivia":11600,"Paraguay":7100,
    "Uruguay":3450,"New Zealand":4800,"Mexico":128000,"Kazakhstan":18700,
}
_LVL = {"China":3,"India":3,"United States":3,"Russia":3,"Japan":2,"Germany":2,
    "France":2,"U.K.":2,"Brazil":2,"Indonesia":2,"Turkey":2,"Iran":2,
    "Egypt":2,"South Africa":2,"Australia":2,"Canada":2,"Mexico":2,
    "Saudi Arabia":2,"Poland":2,"Spain":2,"Italy":2}
_MIL = {"Russia":5,"China":4,"United States":4,"India":3,"N. Korea":3,
    "Turkey":3,"Pakistan":3,"Iran":3,"Egypt":2,"U.K.":2,"France":2,
    "Japan":2,"S. Korea":2,"Germany":1,"Ukraine":2,"Vietnam":1,"Iraq":1,
    "Saudi Arabia":2}
_AIR = {"China":3,"United States":3,"Russia":3,"Canada":3,"Brazil":2,
    "Australia":2,"India":2,"Japan":2,"U.K.":2,"Germany":1,"France":2,
    "Turkey":2,"Indonesia":1,"Mexico":1,"South Africa":1,"Egypt":1,
    "Saudi Arabia":2,"Iran":1,"Thailand":1,"Malaysia":1}
_TRA = {"China":3,"India":3,"Russia":3,"United States":1,"Germany":2,
    "France":2,"U.K.":1,"Japan":2,"Italy":1,"Spain":1,"Poland":1,
    "Ukraine":1,"Turkey":1,"Egypt":1,"Iran":1,"India":3}

def get_pop(n):  return _POP.get(n, 10000)
def get_lvl(n):  return _LVL.get(n, 1)
def get_mil(n):  return _MIL.get(n, 1)
def get_air(n):  return _AIR.get(n, 1)
def get_tra(n):  return _TRA.get(n, 1)


def write_js_output(earth_result, mars_result, output_dir):
    """Write all JS module files."""

    # --- countryPaths.js ---
    lines = ["export const countryPaths = {"]
    for tid, path in sorted(earth_result["paths"].items()):
        lines.append(f'    "{tid}": "{path}",')
    lines.append("};\n// Auto-generated from Natural Earth public domain data\n")
    cp = "\n".join(lines)
    with open(os.path.join(output_dir, "countryPaths.js"), 'w') as f:
        f.write(cp)
    print(f"Wrote countryPaths.js  ({len(earth_result['paths'])} territories)")

    # --- marsPaths.js ---
    mlines = ["export const marsCountryPaths = {"]
    for tid, path in sorted(mars_result["paths"].items()):
        mlines.append(f'    "{tid}": "{path}",')
    mlines.append("};\n// Auto-generated: stylized Mars territory paths\n")
    mp = "\n".join(mlines)
    with open(os.path.join(output_dir, "marsPaths.js"), 'w') as f:
        f.write(mp)
    print(f"Wrote marsPaths.js  ({len(mars_result['paths'])} territories)")

    # --- countries.js ---
    earth_adj = earth_result.get("adjacencies", {})
    clines = ["export const countries = {"]
    for tid, info in sorted(EARTH_TERRITORIES.items()):
        n = info["name"]
        adj = earth_adj.get(tid, [])
        clines.append(
            f'    {tid}: {{ name:"{n}", pop:{get_pop(n)}, level:{get_lvl(n)}, '
            f'owner:"ai", military:{get_mil(n)}, airports:{get_air(n)}, trains:{get_tra(n)}, '
            f'adjacent:[{",".join(f\'"{a}"\' for a in adj)}], world:"earth" }},'
        )
    clines.append("};\n")
    cc = "\n".join(clines)
    with open(os.path.join(output_dir, "countries.js"), 'w') as f:
        f.write(cc)
    print(f"Wrote countries.js  ({len(EARTH_TERRITORIES)} entries)")

    # --- marsCountries.js ---
    mars_adj = mars_result.get("adjacencies", {})
    mclines = ["export const marsCountries = {"]
    for tid in sorted(MARS_INFO.keys()):
        mi = MARS_INFO[tid]
        adj = mars_adj.get(tid, [])
        mclines.append(
            f'    {tid}: {{ name:"{mi["name"]}", pop:{mi["pop"]}, '
            f'level:{mi["level"]}, owner:"ai", military:{mi["military"]}, '
            f'airports:{mi["airports"]}, trains:{mi["trains"]}, '
            f'adjacent:[{",".join(f\'"{a}"\' for a in adj)}], world:"mars" }},'
        )
    mclines.append("};\n")
    mcc = "\n".join(mclines)
    with open(os.path.join(output_dir, "marsCountries.js"), 'w') as f:
        f.write(mcc)
    print(f"Wrote marsCountries.js  ({len(MARS_INFO)} entries)")

    # Report viewBox
    ew, eh = earth_result["viewBox"]
    mw, mh = mars_result["viewBox"]
    print(f"\n{'='*55}")
    print(f"EARTH viewBox: 0 0 {ew} {eh}")
    print(f"MARS  viewBox: 0 0 {mw} {mh}")
    print(f"{'='*55}")

    if earth_result.get("unmatched"):
        print(f"\n⚠ UNMATCHED ({len(earth_result['unmatched'])}): needs manual SVG path")
        for tid, info in earth_result["unmatched"]:
            print(f"  • {tid}: {info['name']} ({info['iso']})")


if __name__ == "__main__":
    output_dir = sys.argv[1] if len(sys.argv) > 1 else "frontend/src/game"
    os.makedirs(output_dir, exist_ok=True)
    print("="*60)
    print("WarXOne Map Generator — Realistic Geographic Borders")
    print("(Natural Earth 110m, public domain)")
    print("="*60)

    # Download/cache Natural Earth
    sf = download_natural_earth()

    # Generate Earth paths
    earth = generate_earth_paths(sf, output_dir)

    # Generate Mars paths
    mars = generate_mars_paths()

    # Write output files
    write_js_output(earth, mars, output_dir)
