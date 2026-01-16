import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

interface IHeaderProps {
  name: string;
}

export const Header = ({ name }: IHeaderProps) => {
  return (
    <View className="bg-primary px-4 py-4 items-center" >
      <Text variant="headlineSmall" className=" font-semibold">
        {name}
      </Text>
    </View>
  );
};
