import React from "react";
import { View, Text, Image, TouchableOpacity, Dimensions } from "react-native";
import { 
  Package, 
  MapPin, 
  AlertTriangle, 
  Calendar, 
  MessageCircle,
  Camera
} from "lucide-react-native";
import { Form } from "~/types";
import { useTheme } from "~/hooks/useTheme";

type Props = {
  report: Form;
  onImagePress: (uris: string[], index: number) => void;
};

export default function ReportCard({ report, onImagePress }: Props) {
  const { colors, isDark } = useTheme();
  const { width } = Dimensions.get('window');
  const isSmallScreen = width < 350;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Bugün';
    if (diffDays === 2) return 'Dün';
    if (diffDays <= 7) return `${diffDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const InfoRow = ({ icon: Icon, label, value, color = colors.textSecondary }: {
    icon: any;
    label: string;
    value: string;
    color?: string;
  }) => (
    <View className="flex-row items-center mb-2">
      <View 
        className="w-8 h-8 rounded-lg items-center justify-center mr-3"
        style={{ backgroundColor: colors.surfaceSecondary }}
      >
        <Icon color={color} size={16} />
      </View>
      <View className="flex-1">
        <Text 
          className="text-xs opacity-70"
          style={{ color: colors.textSecondary }}
        >
          {label}
        </Text>
        <Text 
          className={`font-medium ${isSmallScreen ? 'text-sm' : 'text-base'}`}
          style={{ color: colors.text }}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );

  return (
    <View 
      className="rounded-2xl shadow-sm mb-4 overflow-hidden border"
      style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.border,
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Header */}
      <View className="p-4 pb-3">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <View 
              className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: colors.primary + '20' }}
            >
              <Package color={colors.primary} size={20} />
            </View>
            <View className="flex-1">
              <Text 
                className="text-xs uppercase tracking-wider opacity-70"
                style={{ color: colors.textSecondary }}
              >
                Barkod
              </Text>
              <Text 
                className={`font-bold ${isSmallScreen ? 'text-base' : 'text-lg'}`}
                style={{ color: colors.text }}
                numberOfLines={1}
              >
                {report.barcode}
              </Text>
            </View>
          </View>
          
          {/* Status Badge */}
          <View 
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: colors.success + '20' }}
          >
            <Text 
              className="text-xs font-medium"
              style={{ color: colors.success }}
            >
              {report.status}
            </Text>
          </View>
        </View>

        {/* Info Rows */}
        <InfoRow
          icon={Package}
          label="Ürün Tipi"
          value={report.productType}
        />
        
        <InfoRow
          icon={MapPin}
          label="Bant Numarası"
          value={report.lineNumber}
        />
        
        <InfoRow
          icon={AlertTriangle}
          label="Hata Kodu"
          value={`${report.errorCode.code} - ${report.errorCode.description}`}
          color={colors.warning}
        />

        {/* Not varsa göster */}
        {report.note && (
          <View className="mt-3 p-3 rounded-xl" style={{ backgroundColor: colors.surfaceSecondary }}>
            <View className="flex-row items-center mb-2">
              <MessageCircle color={colors.textSecondary} size={16} />
              <Text 
                className="text-xs font-medium ml-2"
                style={{ color: colors.textSecondary }}
              >
                Not
              </Text>
            </View>
            <Text 
              className="text-sm italic leading-5"
              style={{ color: colors.text }}
            >
              "{report.note}"
            </Text>
          </View>
        )}
      </View>

      {/* Fotoğraflar */}
      {report.photos && report.photos.length > 0 && (
        <View className="px-4 pb-3">
          <View className="flex-row items-center mb-3">
            <Camera color={colors.textSecondary} size={16} />
            <Text 
              className="text-xs font-medium ml-2"
              style={{ color: colors.textSecondary }}
            >
              Fotoğraflar ({report.photos.length})
            </Text>
          </View>
          
          <View className="flex-row flex-wrap">
            {report.photos.map((uri, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => onImagePress(report.photos, index)}
                className="mr-2 mb-2 rounded-xl overflow-hidden border"
                style={{ borderColor: colors.border }}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri }}
                  className={`${isSmallScreen ? 'w-16 h-16' : 'w-20 h-20'}`}
                  resizeMode="cover"
                />
                
                {/* Overlay effect */}
                <View 
                  className="absolute inset-0 bg-black/0 active:bg-black/10"
                  style={{ borderRadius: 12 }}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Footer */}
      <View 
        className="px-4 py-3 border-t flex-row items-center justify-between"
        style={{ 
          borderTopColor: colors.border,
          backgroundColor: colors.surfaceSecondary + '50'
        }}
      >
        <View className="flex-row items-center">
          <Calendar color={colors.textMuted} size={14} />
          <Text 
            className="text-xs ml-2"
            style={{ color: colors.textMuted }}
          >
            {formatDate(report.createdAt)}
          </Text>
        </View>
        
        <Text 
          className="text-xs"
          style={{ color: colors.textMuted }}
        >
          {new Date(report.createdAt).toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    </View>
  );
}