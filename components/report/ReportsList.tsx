import React from "react";
import { FlatList, View, Text, Dimensions, RefreshControlProps  } from "react-native";
import { FileText, Inbox } from "lucide-react-native";
import { useTheme } from "~/hooks/useTheme";
import ReportCard from "~/components/ReportCard";
import { Form } from "~/types/index";
import { RefreshControl } from 'react-native';

type Props = {
  reports: Form[];
  isRefreshing: boolean;
  onRefresh: () => void;
  isLoading: boolean; 
  onImagePress?: (uris: string[], index: number) => void;
};

export default function ReportsList({ reports, isRefreshing, onRefresh, onImagePress }: Props) {
  const { colors } = useTheme();
  const { height } = Dimensions.get('window');

  const EmptyState = () => (
    <View 
      className="flex-1 items-center justify-center px-8"
      style={{ minHeight: height * 0.4 }}
    >
      <View 
        className="w-24 h-24 rounded-full items-center justify-center mb-6"
        style={{ backgroundColor: colors.surfaceSecondary }}
      >
        <Inbox color={colors.textMuted} size={40} />
      </View>
      
      <Text 
        className="text-xl font-semibold mb-2 text-center"
        style={{ color: colors.text }}
      >
        Henüz rapor yok
      </Text>
      
      <Text 
        className="text-sm text-center leading-6"
        style={{ color: colors.textSecondary }}
      >
        İlk raporunuzu oluşturmak için{'\n'}aşağıdaki + butonuna tıklayın
      </Text>
      
      {/* Decorative elements */}
      <View className="absolute top-8 left-8 opacity-20">
        <FileText color={colors.textMuted} size={24} />
      </View>
      <View className="absolute bottom-12 right-12 opacity-20">
        <FileText color={colors.textMuted} size={32} />
      </View>
    </View>
  );

  const renderItem = ({ item, index }: { item: Form; index: number }) => (
    <View
      style={{
        opacity: 1,
        transform: [
          {
            translateY: 0,
          },
        ],
      }}
    >
      <ReportCard 
        report={item} 
        onImagePress={onImagePress || (() => {})} 
      />
    </View>
  );

  const ItemSeparator = () => <View style={{ height: 8 }} />;

  return (
    <FlatList
      data={reports}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      ItemSeparatorComponent={ItemSeparator}
      ListEmptyComponent={EmptyState}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: 100, 
      }}
      removeClippedSubviews={false}
      maxToRenderPerBatch={5}
      updateCellsBatchingPeriod={100}
      initialNumToRender={10}
      windowSize={10}
    />
  );
}