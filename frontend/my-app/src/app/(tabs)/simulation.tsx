import { View, Text } from "react-native";
import { Dropdown } from 'react-native-element-dropdown';
import { Button, TextInput, HelperText } from "react-native-paper";
import { useState } from "react";
import { useRouter } from "expo-router";

const dataWaste = [
  { label: 'Suíno', value: '1' },
  { label: 'Bovino', value: '2' },
  { label: 'Caprino', value: '3' },
  { label: 'Ovino', value: '4' },
  { label: 'Equino', value: '5' },
  { label: 'Galináceo', value: '6' },
];

const dataRegion = [
  { label: 'Borborema', value: '1' },
  { label: 'Agreste', value: '2' },
  { label: 'Sertão', value: '3' },
  { label: 'Mata Paraibana', value: '4' },
];

const anoAtual = new Date().getFullYear();
const anoAtualStr = String(anoAtual);

export default function Simulation() {
  const router = useRouter();

  const [substrato, setSubstrato] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [ano, setAno] = useState('');
  const [regiao, setRegiao] = useState('');

  const [tentouSimular, setTentouSimular] = useState(false);

  const anoInvalido: boolean = !ano || Number(ano) < anoAtual;

  const limpar = () => {
    setSubstrato('');
    setQuantidade('');
    setAno('');
    setRegiao('');
    setTentouSimular(false);
  };

  const simular = () => {
    setTentouSimular(true);
    if (!substrato || !quantidade || anoInvalido || !regiao) return;
    router.push({
      pathname: '/simulationoutput',
      params: { substrato, quantidade, ano, regiao }
    });
  };

  return (
    <View className="flex-1 bg-white">
      <View className="mt-5 gap-4 p-6">

        {/* SUBSTRATO */}
        <View>
          <Text>Substrato</Text>
          <Dropdown
            data={dataWaste}
            style={{
              backgroundColor: tentouSimular && !substrato ? '#FFF0F0' : '#EBEBEB',
              borderWidth: tentouSimular && !substrato ? 1 : 0,
              borderColor: '#B00020',
              width: '100%',
              height: 40,
              borderRadius: 5,
              paddingHorizontal: 8,
            }}
            labelField="label"
            valueField="value"
            placeholder="Selecione"
            value={dataWaste.find(item => item.label === substrato)?.value ?? null}
            onChange={(item: { label: string; value: string }) => setSubstrato(item.label)}
          />
          <HelperText type="error" visible={tentouSimular && !substrato}>
            Selecione um substrato
          </HelperText>
        </View>

        {/* QUANTIDADE */}
        <View>
          <TextInput
            label="Incremento [%]"
            placeholder="Digite aqui"
            value={quantidade}
            onChangeText={setQuantidade}
            keyboardType="numeric"
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="#2D6EFF"
            style={{ backgroundColor: '#EBEBEB' }}
            error={tentouSimular && !quantidade}
          />
          <HelperText type="error" visible={tentouSimular && !quantidade}>
            Informe a quantidade
          </HelperText>
        </View>

        {/* ANO */}
        <View>
          <TextInput
            label="Ano"
            placeholder="Digite aqui"
            value={ano}
            onChangeText={setAno}
            onBlur={() => {
              if (Number(ano) < anoAtual) setAno(anoAtualStr);
            }}
            keyboardType="numeric"
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="#2D6EFF"
            style={{ backgroundColor: '#EBEBEB' }}
            error={tentouSimular && anoInvalido}
          />
          <HelperText type="error" visible={tentouSimular && anoInvalido}>
            Informe um ano a partir de {anoAtualStr}
          </HelperText>
        </View>

        {/* REGIÃO */}
        <View>
          <Text>Região</Text>
          <Dropdown
            data={dataRegion}
            style={{
              backgroundColor: tentouSimular && !regiao ? '#FFF0F0' : '#EBEBEB',
              borderWidth: tentouSimular && !regiao ? 1 : 0,
              borderColor: '#B00020',
              width: '100%',
              height: 40,
              borderRadius: 5,
              paddingHorizontal: 8,
            }}
            labelField="label"
            valueField="value"
            placeholder="Selecione"
            value={dataRegion.find(item => item.label === regiao)?.value ?? null}
            onChange={(item: { label: string; value: string }) => setRegiao(item.label)}
          />
          <HelperText type="error" visible={tentouSimular && !regiao}>
            Selecione uma região
          </HelperText>
        </View>

        {/* BOTÕES */}
        <View className="flex-row justify-between items-center">
          <Button mode="contained" buttonColor="#2D6EFF" className="w-60" onPress={simular}>
            Simular
          </Button>
          <Button mode="contained" buttonColor="#2D6EFF" className="w-30" onPress={limpar}>
            Limpar
          </Button>
        </View>

      </View>
    </View>
  );
}