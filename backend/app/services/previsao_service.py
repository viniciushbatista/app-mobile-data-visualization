"""
Integracao futura com Prophet.

O Prophet preve apenas a quantidade de cabecas (quantidade_animais).
O potencial energetico e calculado reutilizando energia_service.calcular_de_cabecas().
"""

from sqlalchemy.orm import Session

from app.services.energia_service import EnergiaService, ResultadoEnergia


class PrevisaoService:
    def __init__(self, db: Session) -> None:
        self.energia = EnergiaService(db)

    def potencial_de_previsao(
        self,
        *,
        substrato: str,
        quantidade_prevista: float,
        municipio: str,
        mesorregiao: str,
        codigo_ibge: int,
        ano: int,
    ) -> ResultadoEnergia:
        """
        Apos o Prophet gerar cabecas previstas, chame este metodo.

        Exemplo de fluxo:
            cabecas = prophet.prever_serie(...)
            resultado = previsao_service.potencial_de_previsao(
                substrato="Bovino",
                quantidade_prevista=cabecas,
                ...
            )
        """
        return self.energia.calcular_de_cabecas(
            substrato=substrato,
            quantidade_animais=quantidade_prevista,
            municipio=municipio,
            mesorregiao=mesorregiao,
            codigo_ibge=codigo_ibge,
            ano=ano,
        )
