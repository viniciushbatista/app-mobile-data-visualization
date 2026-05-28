import pytest

from app.services.energia_calculos import (
    calcular_massa_anual_kg,
    calcular_parametros_completos,
    calcular_pci_kcal_kg,
    calcular_pcs_kcal_kg,
    calcular_potencial_tj,
    calcular_w,
    kcal_para_kj,
)

# Parametros quimicos do Bovino
BOVINO = {
    "c": 0.4938,
    "h": 0.0646,
    "o": 0.3979,
    "s": 0.0105,
    "u": 0.707,
    "dejeto_kg_dia": 23.5,
}


class TestCalculoW:
    def test_agua_combustao_bovino(self) -> None:
        w = calcular_w(BOVINO["h"], BOVINO["u"])
        assert w == pytest.approx(1.2884, rel=1e-4)


class TestCalculoPCS:
    def test_pcs_kcal_bovino(self) -> None:
        pcs = calcular_pcs_kcal_kg(
            BOVINO["c"], BOVINO["h"], BOVINO["o"], BOVINO["s"]
        )
        assert pcs == pytest.approx(4537.31, rel=1e-3)


class TestCalculoPCI:
    def test_pci_kcal_bovino(self) -> None:
        w = calcular_w(BOVINO["h"], BOVINO["u"])
        pcs = calcular_pcs_kcal_kg(
            BOVINO["c"], BOVINO["h"], BOVINO["o"], BOVINO["s"]
        )
        pci = calcular_pci_kcal_kg(pcs, w)
        assert pci == pytest.approx(3764.27, rel=1e-3)


class TestConversaoKj:
    def test_pcs_kj_bovino(self) -> None:
        pcs_kcal = calcular_pcs_kcal_kg(
            BOVINO["c"], BOVINO["h"], BOVINO["o"], BOVINO["s"]
        )
        pcs_kj = kcal_para_kj(pcs_kcal)
        assert pcs_kj == pytest.approx(18996.85, rel=1e-3)


class TestMassaAnual:
    def test_massa_anual_120mil_cabecas_bovino(self) -> None:
        massa = calcular_massa_anual_kg(120_000, BOVINO["dejeto_kg_dia"])
        assert massa == pytest.approx(1_029_300_000.0, rel=1e-6)


class TestPotencialTJ:
    def test_potencial_tj_exemplo_patos(self) -> None:
        pcs_kj = kcal_para_kj(
            calcular_pcs_kcal_kg(
                BOVINO["c"], BOVINO["h"], BOVINO["o"], BOVINO["s"]
            )
        )
        massa = calcular_massa_anual_kg(120_000, BOVINO["dejeto_kg_dia"])
        potencial = calcular_potencial_tj(massa, pcs_kj)
        assert potencial == pytest.approx(19_552.6, rel=1e-2)


class TestParametrosCompletos:
    def test_seed_bovino_consistente(self) -> None:
        p = calcular_parametros_completos(**BOVINO)
        assert p["w"] == pytest.approx(1.2884, rel=1e-4)
        assert p["pcs_kcal_kg"] == pytest.approx(4537.31, rel=1e-3)
        assert p["pci_kcal_kg"] == pytest.approx(3764.27, rel=1e-3)
        assert p["pcs_kj_kg"] == pytest.approx(18996.85, rel=1e-3)
