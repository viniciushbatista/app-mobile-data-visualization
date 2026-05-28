"""
Funcoes puras de calculo energetico (Dulong).

Reutilizadas pelo energia_service e pelo Prophet (previsao de cabecas).
"""

KCAL_PARA_KJ = 4.184

KJ_PARA_TJ = 1_000_000_000
DIAS_ANO = 365


def calcular_w(h: float, u: float) -> float:
    """Agua de combustao: W = (9 * H) + U"""
    return (9 * h) + u


def calcular_pcs_kcal_kg(c: float, h: float, o: float, s: float) -> float:
    """PCS = (8100 * C) + (34400 * (H - O/8)) + (2500 * S)"""
    return (8100 * c) + (34400 * (h - (o / 8))) + (2500 * s)


def calcular_pci_kcal_kg(pcs_kcal_kg: float, w: float) -> float:
    """PCI = PCS - (600 * W)"""
    return pcs_kcal_kg - (600 * w)


def kcal_para_kj(kcal: float) -> float:
    return kcal * KCAL_PARA_KJ


def calcular_massa_anual_kg(
    quantidade_animais: float, dejeto_kg_dia: float
) -> float:
    """massa_anual_kg = quantidade * dejeto_kg_dia * 365"""
    return quantidade_animais * dejeto_kg_dia * DIAS_ANO


def calcular_potencial_kj(massa_anual_kg: float, pcs_kj_kg: float) -> float:
    """potencial_kj = massa_anual_kg * pcs_kj_kg"""
    return massa_anual_kg * pcs_kj_kg


def calcular_potencial_tj(massa_anual_kg: float, pcs_kj_kg: float) -> float:
    """potencial_tj = potencial_kj / 1e9"""
    return calcular_potencial_kj(massa_anual_kg, pcs_kj_kg) / KJ_PARA_TJ


def calcular_parametros_completos(
    *,
    c: float,
    h: float,
    o: float,
    s: float,
    u: float,
    dejeto_kg_dia: float,
) -> dict[str, float]:
    """Calcula W, PCS e PCI (kcal e kJ) a partir dos parametros quimicos."""
    w = calcular_w(h, u)
    pcs_kcal = calcular_pcs_kcal_kg(c, h, o, s)
    pci_kcal = calcular_pci_kcal_kg(pcs_kcal, w)
    pcs_kj = kcal_para_kj(pcs_kcal)
    pci_kj = kcal_para_kj(pci_kcal)
    return {
        "c": c,
        "h": h,
        "o": o,
        "s": s,
        "u": u,
        "w": w,
        "pcs_kcal_kg": pcs_kcal,
        "pcs_kj_kg": pcs_kj,
        "pci_kcal_kg": pci_kcal,
        "pci_kj_kg": pci_kj,
        "dejeto_kg_dia": dejeto_kg_dia,
    }
