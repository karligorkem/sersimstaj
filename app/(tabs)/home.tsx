import { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, StatusBar, Dimensions, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from 'expo-router';
import { useTheme } from "~/hooks/useTheme";
import { useToast } from "~/contexts/ToastContext";
import HeaderBadge from "~/components/HeaderBadge";
import FloatingButton from "~/components/FloatingButton";
import ReportsList from "~/components/report/ReportsList";
import ReportFormModal from "~/components/report/ReportFormModal";
import PhotoPreviewModal from "~/components/report/PhotoPreviewModal";
import { FormService } from '~/services/formData.service';
import { Form, RNFile } from '~/types/index';
import { BarChart3, Clock, CheckCircle2, TrendingUp } from "lucide-react-native";

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  
  const [reports, setReports] = useState<Form[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false); // State adı daha anlaşılır yapıldı
  const [refreshing, setRefreshing] = useState(false);
  const [previewPhotos, setPreviewPhotos] = useState<string[] | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Raporları getiren fonksiyon
  const fetchReports = async () => {
    try {
      const response = await FormService.getForms();
      // API'den gelen veriyi en yeniden en eskiye sırala
      const sortedReports = response.sort((a: Form, b: Form) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setReports(sortedReports);
    } catch (error) {
      console.error("Raporlar getirilirken hata oluştu:", error);
      showToast("Raporlar getirilirken hata oluştu", "error", 3000);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Ekran her odaklandığında raporları yeniden yükle
  useFocusEffect(
    useCallback(() => {
      if (!isModalVisible) { 
        setIsLoading(true);
        fetchReports();
      }
    }, [isModalVisible])
  );

  // İstatistikleri hesaplayan bölüm
  const { todayCount, totalCount, weekCount } = useMemo(() => {
    const todayISO = new Date().toISOString().slice(0, 10);
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1) )); // Haftanın başlangıcı (Pazartesi)
    weekStart.setHours(0, 0, 0, 0);

    const tCount = reports.length;
    const dCount = reports.filter((r) => r.createdAt.slice(0, 10) === todayISO).length;
    const wCount = reports.filter((r) => new Date(r.createdAt) >= weekStart).length;
    
    return { todayCount: dCount, totalCount: tCount, weekCount: wCount };
  }, [reports]);

  // Sayfayı yenileme fonksiyonu
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
  };

  // Rapor başarıyla gönderildiğinde çalışacak fonksiyon
  const handleSubmissionSuccess = () => {
    setIsModalVisible(false);
    fetchReports(); // Listeyi anında güncelle
  };

  // ReportFormModal için onSubmitOnline handler
  const handleSubmitOnline = async (values: {
    barcode: string;
    productType: string;
    lineNumber: string;
    errorCode: string;
    errorCodeId: number;
    note?: string;
    photos: string[];
    isModalVisible: boolean;
  }) => {
    try {
      // Form verilerini CreateFormPayload formatına çevir
      const formPayload = {
        Code: values.barcode,
        Type: values.productType,
        Name: values.barcode, // Barkod'u name olarak kullan
        ProductError: values.note || '',
        ErrorCodeId: values.errorCodeId || 1, // Seçilen error code ID'si
        LineId: 1, // Default line ID - gerçek uygulamada line service'den alınmalı
        Quantity: 1, // Default quantity
      };

      // Fotoğrafları RNFile formatına çevir
      const photoFiles = values.photos.map((uri, index) => ({
        uri,
        type: 'image/jpeg',
        name: `photo_${index}.jpg`,
      }));

      // FormService ile raporu gönder
      await FormService.submitForm(formPayload, photoFiles);
      showToast("Rapor başarıyla gönderildi", "success", 2000);
      handleSubmissionSuccess();
    } catch (error) {
      console.error("Rapor gönderilirken hata:", error);
      showToast("Rapor gönderilirken hata oluştu", "error", 3000);
    }
  };

  // İstatistik kartı bileşeni
  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <View 
      className="flex-1 rounded-2xl p-4 mx-1 shadow-sm"
      style={{ backgroundColor: colors.surface }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View 
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: color + '20' }}
        >
          <Icon color={color} size={20} />
        </View>
        <Text 
          className="text-2xl font-bold"
          style={{ color: colors.text }}
        >
          {value}
        </Text>
      </View>
      <Text className="text-sm font-medium mb-1" style={{ color: colors.text }}>
        {title}
      </Text>
      <Text className="text-xs" style={{ color: colors.textSecondary }}>
        {subtitle}
      </Text>
    </View>
  );

  return (
    <SafeAreaView 
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      
      <View className="flex-1 px-4 pt-2">
        <HeaderBadge />

        {/* İstatistik kartları */}
        <View className="flex-row mb-4">
          <StatCard title="Bugün" value={todayCount} subtitle="Yeni rapor" icon={Clock} color={colors.primary} />
          <StatCard title="Bu Hafta" value={weekCount} subtitle="Toplam rapor" icon={TrendingUp} color={colors.accent} />
          <StatCard title="Toplam" value={totalCount} subtitle="Tüm raporlar" icon={BarChart3} color={colors.success} />
        </View>

        {/* Raporlar Başlık */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <CheckCircle2 color={colors.textSecondary} size={20} />
            <Text className="text-lg font-semibold ml-2" style={{ color: colors.text }}>
              Son Raporlar
            </Text>
          </View>
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            {reports.length} rapor
          </Text>
        </View>

        <ReportsList 
          reports={reports} 
          isRefreshing={refreshing}
          onRefresh={onRefresh}
          isLoading={isLoading}
        />

        {/* ReportFormModal - Conditional rendering ile göster/gizle */}
        {isModalVisible && (
          <ReportFormModal
            onCancel={() => setIsModalVisible(false)}
            onSubmitOnline={handleSubmitOnline}
          />
        )}
        
        <FloatingButton onPress={() => setIsModalVisible(true)} />
        
        <PhotoPreviewModal 
          uri={previewPhotos?.[previewIndex] || null}
          onClose={() => setPreviewPhotos(null)}
        />
      </View>
    </SafeAreaView>
  );
}