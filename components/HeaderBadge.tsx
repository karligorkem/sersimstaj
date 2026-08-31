import React, { useState, useEffect } from "react";
import { View, Text, Dimensions } from "react-native";
import { Building2, User } from "lucide-react-native";
import { useTheme } from "~/hooks/useTheme";
import { useAuth } from "~/contexts/AuthContext";
import { LineService } from "~/services/line.service";
import { LineDto } from "~/types";
import LogoLight_2 from "~/assets/images/sersim-light.svg";
import LogoDark_2 from "~/assets/images/sersim-dark.svg";

export default function HeaderBadge() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { width } = Dimensions.get('window');
  
  const [lines, setLines] = useState<LineDto[]>([]);
  const [selectedLine, setSelectedLine] = useState<LineDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLines = async () => {
      setIsLoading(true);
      try {
        const response = await LineService.getLines();
        setLines(response.data);
        
        // Kullanıcının line ID'sine göre doğru line'ı bul
        if (user?.line && response.data.length > 0) {
          // user.line formatı: "Line 1" -> lineId: 1
          const lineIdMatch = user.line.match(/Line (\d+)/);
          if (lineIdMatch) {
            const lineId = parseInt(lineIdMatch[1]);
            const userLine = response.data.find(line => line.id === lineId);
            if (userLine) {
              setSelectedLine(userLine);
            } else {
              // Eğer kullanıcının line'ı bulunamazsa ilk line'ı seç
              setSelectedLine(response.data[0]);
            }
          } else {
            // Format uyumsuzsa ilk line'ı seç
            setSelectedLine(response.data[0]);
          }
        } else if (response.data.length > 0) {
          // Kullanıcı line bilgisi yoksa ilk line'ı seç
          setSelectedLine(response.data[0]);
        }
      } catch (error) {
        console.error("Çalışma bantları alınamadı:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLines();
  }, [user?.line]); // user.line değiştiğinde yeniden yükle
  
  const isSmallScreen = width < 350;

  return (
    <View 
      className={`rounded-2xl mb-4 shadow-lg overflow-hidden relative ${isSmallScreen ? 'mx-1' : 'mx-0'}`}
      style={{ backgroundColor: colors.surface }}
    >
      {/* Gradient background overlay */}
      <View 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundColor: colors.primary,
        }}
      />
      
      {/* Ana içerik */}
      <View className={`p-4 ${isSmallScreen ? 'p-3' : 'p-4'}`}>
        {/* Üst kısım - Hoşgeldin mesajı */}
        <View className="flex-row items-center mb-3">
          <View 
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: colors.primary }}
          >
            <User color={colors.primaryForeground} size={20} />
          </View>
          <View className="flex-1">
            <Text 
              className={`text-xs uppercase tracking-wider opacity-70 ${isSmallScreen ? 'text-xs' : 'text-sm'}`}
              style={{ color: colors.textSecondary }}
            >
              Hoşgeldin
            </Text>
            <Text 
              className={`font-bold ${isSmallScreen ? 'text-lg' : 'text-xl'}`}
              style={{ color: colors.text }}
              numberOfLines={1}
            >
              {user?.username || 'Kullanıcı Adı'}
            </Text>
          </View>
        </View>

        {/* Alt kısım - Bant bilgisi (Admin ve SuperAdmin kullanıcıları için gizle) */}
        {user?.role !== 'admin' && user?.role !== 'Admin' && user?.role !== 'SuperAdmin' && (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View 
                className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                style={{ backgroundColor: colors.surfaceSecondary }}
              >
                <Building2 color={colors.primary} size={16} />
              </View>
              <View>
                <Text 
                  className="text-xs opacity-70"
                  style={{ color: colors.textSecondary }}
                >
                  {user?.role === 'User' ? 'Atanmış Bant' : 'Çalışma Bandı'}
                </Text>
                <Text 
                  className={`font-semibold ${isSmallScreen ? 'text-sm' : 'text-base'}`}
                  style={{ color: colors.text }}
                >
                  {isLoading ? 'Yükleniyor...' : (selectedLine ? selectedLine.name : 'Hat Seçilmedi')}
                </Text>
              </View>
            </View>

            {/* Status indicator */}
            <View className="flex-row items-center">
              <View 
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: colors.success }}
              />
              <Text 
                className="text-xs font-medium"
                style={{ color: colors.textSecondary }}
              >
                Aktif
              </Text>
            </View>
          </View>
        )}

        {/* Decorative elements */}
        <View className="absolute top-2 right-4 w-20 h-20 opacity-100">
          {isDark ? (
            <LogoDark_2 width={80} height={80} />
          ) : (
            <LogoLight_2 width={80} height={80} />
          )}
        </View>
      </View>
    </View>
  );
}