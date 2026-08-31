import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, CameraView, useCameraPermissions } from "expo-camera";
import { 
  X, 
  Camera as CameraIcon, 
  QrCode, 
  AlertCircle, 
  Check,
  Loader,
  Trash2
} from "lucide-react-native";
import { useTheme } from "~/hooks/useTheme";
import PhotoPreviewModal from "~/components/report/PhotoPreviewModal";
import { ErrorCodeService } from "~/services/errorCode.service";
import { ErrorCodeDto } from "~/types/index";

// Ref Tipleri: useRef<TextInput | null>(null) olarak düzeltildi
// Focus Fonksiyonu: Parametre tipi React.RefObject<TextInput | null> olarak güncellendi
// Null Safety: ?. operatörü ile null kontrolleri korundu


interface ReportFormModalProps {
  initialLineNumber?: string;
  onCancel: () => void;
  onSubmitOnline: (values: {
    barcode: string;
    productType: string;
    lineNumber: string;
    errorCode: string;
    errorCodeId: number;
    note?: string;
    photos: string[];
    isModalVisible: boolean;
  }) => void;
}

interface FormErrors {
  barcode?: string;
  productType?: string;
  lineNumber?: string;
  errorCode?: string;
  errorCodeId?: string;
  note?: string;
  photos?: string;
  isModalVisible?: string;
}

export default function ReportFormModal({
  initialLineNumber,
  onCancel,
  onSubmitOnline,
}: ReportFormModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [errorQuery, setErrorQuery] = useState("");
  const [isErrorListOpen, setIsErrorListOpen] = useState(false);
  const [errorCodes, setErrorCodes] = useState<ErrorCodeDto[]>([]);
  const [filteredErrors, setFilteredErrors] = useState<ErrorCodeDto[]>([]);
  const [isLoadingErrorCodes, setIsLoadingErrorCodes] = useState(true);
  
  // Filtreleme fonksiyonu - her çağrıldığında güncel sonuçları döndürür
  const updateFilteredErrors = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setFilteredErrors(errorCodes); // Boş sorgu ise tüm hata kodlarını göster
    } else {
      const filtered = errorCodes.filter((e: ErrorCodeDto) => 
        e.code.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
      );
      setFilteredErrors(filtered);
    }
  };

  const [formData, setFormData] = useState({
    barcode: "",
    productType: "",
    lineNumber: initialLineNumber || "",
    errorCode: "",
    errorCodeId: 1, // Error code ID'sini de sakla
    note: "",
    photos: [] as string[],
    isModalVisible: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraMode, setCameraMode] = useState<"none" | "barcode" | "photo">("none");
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  // Hata kodlarını API'den çek
  useEffect(() => {
    const fetchErrorCodes = async () => {
      try {
        setIsLoadingErrorCodes(true);
        const response = await ErrorCodeService.getErrorCodes();
        setErrorCodes(response.data);
        setFilteredErrors(response.data);
        console.log('Hata kodları başarıyla yüklendi:', response.data.length, 'adet');
      } catch (error) {
        console.error('Hata kodları yüklenirken hata:', error);
        // Fallback olarak boş array kullan
        setErrorCodes([]);
        setFilteredErrors([]);
      } finally {
        setIsLoadingErrorCodes(false);
      }
    };

    fetchErrorCodes();
  }, []);

  // input refs for proper next-focus behavior
  const barcodeRef = useRef<TextInput | null>(null);
  const productTypeRef = useRef<TextInput | null>(null);
  const lineNumberRef = useRef<TextInput | null>(null);
  const errorCodeRef = useRef<TextInput | null>(null);
  const noteRef = useRef<TextInput | null>(null);

  // --- Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.barcode.trim()) {
      newErrors.barcode = "Barkod gereklidir";
    } else if (formData.barcode.length < 3) {
      newErrors.barcode = "Barkod en az 3 karakter olmalıdır";
    }

    if (!formData.productType.trim()) {
      newErrors.productType = "Ürün tipi gereklidir";
    }

    if (!formData.lineNumber.trim()) {
      newErrors.lineNumber = "Bant numarası gereklidir";
    }

    if (!formData.errorCode.trim()) {
      newErrors.errorCode = "Hata kodu gereklidir";
    }

    if (formData.photos.length === 0) {
      newErrors.photos = "En az bir fotoğraf gereklidir";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Barcode handler
  const handleBarCodeScanned = useCallback((event: { type: string; data: string }) => {
    if (scanning) return;
    setScanning(true);
    
    setFormData((prev) => ({ ...prev, barcode: event.data }));
    setErrors((prev) => ({ ...prev, barcode: undefined }));
    setCameraMode("none");
    
    setTimeout(() => setScanning(false), 1000);
  }, [scanning]);

  // --- Photo
  const takePhoto = useCallback(async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ 
          quality: 0.8,
        });
        if (photo?.uri) {
          setFormData((prev) => ({
            ...prev,
            photos: [...prev.photos, photo.uri],
          }));
          setErrors((prev) => ({ ...prev, photos: undefined }));
        }
        setCameraMode("none");
      } catch (error) {
        Alert.alert("Hata", "Fotoğraf çekilirken bir hata oluştu");
      }
    }
  }, []);

  const removePhoto = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  }, []);

  // --- Submit
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400)); // simulated delay
      onSubmitOnline(formData);
    } catch (error) {
      Alert.alert("Hata", "Rapor gönderilirken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmitOnline]);

  // --- Input change - DÜZELTME: useCallback kaldırıldı, basit fonksiyon
  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Error'ı hemen temizle
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // --- Number field update
  const updateNumberField = (field: 'errorCodeId', value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Error'ı hemen temizle
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // --- Open camera - DÜZELTME: Daha basit yaklaşım
  const openBarcodeCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    setCameraMode("barcode");
  };

  const openPhotoCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    setCameraMode("photo");
  };

  // --- DÜZELTME: Fokus handling fonksiyonları
  const focusNext = (nextRef: React.RefObject<TextInput | null>) => {
    setTimeout(() => {
      nextRef.current?.focus();
    }, 100);
  };

    return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <View 
          style={{
            flex: 1,
            backgroundColor: colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            marginTop: insets.top + 20,
            overflow: "hidden",
          }}
        >
        {/* Header */}
        <View 
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 24,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}>
            Yeni Rapor
          </Text>
          <TouchableOpacity 
            onPress={onCancel} 
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.surfaceSecondary,
            }}
          >
            <X color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        {/* 
          Ana ScrollView: Form içeriğini kaydırılabilir hale getirir
          nestedScrollEnabled: Dropdown ScrollView ile çakışmayı önler
          keyboardShouldPersistTaps: Klavye açıkken dropdown'a tıklanabilir olmasını sağlar
          keyboardDismissMode: Kaydırırken klavyeyi kapatır
        */}
        <ScrollView 
          style={{ flex: 1, paddingHorizontal: 24 }}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          nestedScrollEnabled={true} // Dropdown ScrollView ile çakışmayı önle
        >
          {/* Barkod */}
          <View style={{ marginBottom: 16, marginTop: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>
                Barkod
              </Text>
              <Text style={{ marginLeft: 4, color: "#ef4444" }}>*</Text>
            </View>
            
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TextInput
                ref={barcodeRef}
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: errors.barcode ? "#f87171" : "transparent",
                  backgroundColor: colors.surfaceSecondary,
                  color: colors.text,
                  height: 48,
                  marginRight: 12,
                }}
                placeholder="Barkod okut veya manuel gir"
                placeholderTextColor={colors.textMuted}
                value={formData.barcode}
                onChangeText={(text) => updateField("barcode", text)}
                returnKeyType="next"
                onSubmitEditing={() => focusNext(productTypeRef)}
                blurOnSubmit={false}
                autoCorrect={false}
                autoCapitalize="none"
              />

              <TouchableOpacity 
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.primary,
                }} 
                onPress={openBarcodeCamera}
              >
                <QrCode color={colors.primaryForeground} size={20} />
                </TouchableOpacity>
              </View>
              
            {errors.barcode && (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                <AlertCircle color={colors.error} size={16} />
                <Text style={{ marginLeft: 4, fontSize: 14, color: colors.error }}>
                  {errors.barcode}
                </Text>
              </View>
            )}
          </View>

          {/* Kamera Görünümü */}
          {cameraMode !== "none" && (
            <View style={{ height: 320, borderRadius: 16, overflow: "hidden", marginBottom: 24, position: "relative" }}>
              <CameraView
                ref={cameraRef}
                style={{ flex: 1 }}
                facing="back"
                onBarcodeScanned={cameraMode === "barcode" ? handleBarCodeScanned : undefined}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr", "ean13", "ean8", "code128"],
                }}
              />
              <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.2)" }} />

              {cameraMode === "barcode" && (
                <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
                  <View 
                    style={{
                      width: 256,
                      height: 256,
                      borderWidth: 2,
                      borderColor: "white",
                      borderRadius: 16,
                      borderStyle: "dashed",
                    }} 
                  />
                  <Text style={{ color: "white", textAlign: "center", marginTop: 16, fontWeight: "500" }}>
                    Barkodu kameraya tutun
                  </Text>
                </View>
              )}

              {cameraMode === "photo" && (
                <TouchableOpacity 
                  style={{
                    position: "absolute",
                    bottom: 24,
                    alignSelf: "center",
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    borderWidth: 4,
                    borderColor: "white",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.primary,
                  }} 
                  onPress={takePhoto}
                >
                  <CameraIcon color="white" size={24} />
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  alignItems: "center",
                  justifyContent: "center",
                }} 
                onPress={() => setCameraMode("none")}
              >
                <X color="white" size={20} />
              </TouchableOpacity>
            </View>
          )}

          {/* Ürün Tipi */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>
                Ürün Tipi
              </Text>
              <Text style={{ marginLeft: 4, color: "#ef4444" }}>*</Text>
            </View>

            <TextInput
              ref={productTypeRef}
              style={{
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: errors.productType ? "#f87171" : "transparent",
                backgroundColor: colors.surfaceSecondary,
                color: colors.text,
                height: 48,
              }}
              placeholder="Ürün tipini girin"
              placeholderTextColor={colors.textMuted}
              value={formData.productType}
              onChangeText={(text) => updateField("productType", text)}
              returnKeyType="next"
              onSubmitEditing={() => focusNext(lineNumberRef)}
              blurOnSubmit={false}
              autoCorrect={false}
            />

            {errors.productType && (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                <AlertCircle color={colors.error} size={16} />
                <Text style={{ marginLeft: 4, fontSize: 14, color: colors.error }}>
                  {errors.productType}
                </Text>
              </View>
            )}
          </View>

          {/* Bant Numarası */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>
                Bant Numarası
              </Text>
              <Text style={{ marginLeft: 4, color: "#ef4444" }}>*</Text>
              </View>
              
            <TextInput
              ref={lineNumberRef}
              style={{
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: errors.lineNumber ? "#f87171" : "transparent",
                backgroundColor: colors.surfaceSecondary,
                color: colors.text,
                height: 48,
              }}
              placeholder="Bant numarasını girin"
              placeholderTextColor={colors.textMuted}
              value={formData.lineNumber}
              onChangeText={(text) => updateField("lineNumber", text)}
              returnKeyType="next"
              onSubmitEditing={() => focusNext(errorCodeRef)}
              blurOnSubmit={false}
              autoCorrect={false}
            />

            {errors.lineNumber && (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                <AlertCircle color={colors.error} size={16} />
                <Text style={{ marginLeft: 4, fontSize: 14, color: colors.error }}>
                  {errors.lineNumber}
                </Text>
              </View>
            )}
          </View>

          {/* Hata Kodu */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>
                Hata Kodu
              </Text>
              <Text style={{ marginLeft: 4, color: "#ef4444" }}>*</Text>
            </View>
            <View style={{ position: "relative" }}>
              <TextInput
                ref={errorCodeRef}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: errors.errorCode ? "#f87171" : "transparent",
                  backgroundColor: colors.surfaceSecondary,
                  color: colors.text,
                  height: 48,
                }}
                placeholder="Hata kodu ara veya seç"
                placeholderTextColor={colors.textMuted}
                value={errorQuery || formData.errorCode}
                onChangeText={(text) => {
                  
                  setErrorQuery(text);
                  updateFilteredErrors(text); 
                  setIsErrorListOpen(true);
                  
                  if (!text) {
                    updateField("errorCode", "");
                    updateNumberField("errorCodeId", 1);
                  }
                }}
                onFocus={() => setIsErrorListOpen(true)}
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => focusNext(noteRef)}
              />
              {isErrorListOpen && (
                <>
                  
                  <TouchableOpacity
                    style={{
                      position: "absolute",
                      top: 0,
                      left: -24, 
                      right: -24, 
                      bottom: -1000, 
                      zIndex: 9998, 
                    }}
                    activeOpacity={1} 
                    onPress={() => setIsErrorListOpen(false)} 
                  />
                  
                  
                  <View
                    style={{
                      position: "absolute",
                      top: 52,
                      left: 0,
                      right: 0,
                      maxHeight: 260, 
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.surfaceSecondary,
                      zIndex: 9999, 

                    }}
                  >
                    
                    <ScrollView 
                      style={{ maxHeight: 260 }} 
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true} 
                      keyboardShouldPersistTaps="always" 
                    >
                      {/* Loading veya sonuç yoksa gösterilecek mesaj */}
                      {isLoadingErrorCodes ? (
                        <Text style={{ padding: 12, color: colors.textMuted }}>Hata kodları yükleniyor...</Text>
                      ) : filteredErrors.length === 0 ? (
                        <Text style={{ padding: 12, color: colors.textMuted }}>Sonuç yok</Text>
                      ) : (
                       
                        filteredErrors.map((e: ErrorCodeDto) => (
                          <TouchableOpacity
                            key={e.id}
                            onPress={() => {
                              updateField("errorCode", e.code);
                              updateNumberField("errorCodeId", e.id);
                              setErrorQuery(`${e.code} — ${e.description}`);                              
                              setIsErrorListOpen(false);
                            }}
                            style={{                              
                              borderBottomWidth: 1,
                              borderBottomColor: colors.border,
                            }}
                          >
                            {/* Hata kodu ve açıklamasını göster */}
                            <Text style={{ padding: 12, color: colors.text }}>{`${e.code} - ${e.description}`}</Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                </>
              )}
            </View>

            {errors.errorCode && (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                <AlertCircle color={colors.error} size={16} />
                <Text style={{ marginLeft: 4, fontSize: 14, color: colors.error }}>
                  {errors.errorCode}
                </Text>
              </View>
            )}
          </View>

          {/* Not */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>
                Not
              </Text>
            </View>

            <TextInput
              ref={noteRef}
              style={{
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "transparent",
                backgroundColor: colors.surfaceSecondary,
                color: colors.text,
                height: 96,
                textAlignVertical: "top",
              }}
              placeholder="Ek açıklama (isteğe bağlı)"
              placeholderTextColor={colors.textMuted}
              value={formData.note}
              onChangeText={(text) => updateField("note", text)}
              multiline
              returnKeyType="default"
              blurOnSubmit={true}
            />
          </View>


          {/* Fotoğraflar */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>
                Fotoğraflar
              </Text>
              <Text style={{ marginLeft: 4, color: "#ef4444" }}>*</Text>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={{ marginBottom: 8 }}
            >
              {formData.photos.map((uri, idx) => (
                <View key={idx} style={{ marginRight: 12, position: "relative" }}>
                  <TouchableOpacity onPress={() => setPreviewUri(uri)} activeOpacity={0.9}>
                    <Image source={{ uri }} style={{ width: 96, height: 96, borderRadius: 12 }} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={{ 
                      position: "absolute",
                      top: -8,
                      right: -8,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                        backgroundColor: colors.error, 
                      }}
                    onPress={() => removePhoto(idx)}
                    >
                    <Trash2 color="white" size={12} />
                    </TouchableOpacity>
                  </View>
                ))}
                
                <TouchableOpacity 
                  style={{ 
                  width: 96,
                  height: 96,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                    borderWidth: 2, 
                  borderStyle: "dashed",
                    borderColor: colors.border, 
                  backgroundColor: colors.surfaceSecondary,
                }} 
                onPress={openPhotoCamera}
              >
                <CameraIcon color={colors.textMuted} size={24} />
                <Text style={{ fontSize: 12, marginTop: 4, textAlign: "center", color: colors.textMuted }}>
                  Ekle
                </Text>
                </TouchableOpacity>
              </ScrollView>

            {errors.photos && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <AlertCircle color={colors.error} size={16} />
                <Text style={{ marginLeft: 4, fontSize: 14, color: colors.error }}>
                  {errors.photos}
                </Text>
              </View>
            )}
          </View>
            </ScrollView>

        {/* Action Buttons */}
        <View 
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            padding: 24,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingBottom: Math.max(16, insets.bottom + 8),
          }}
        >
              <TouchableOpacity 
            style={{
              flex: 1,
              paddingVertical: 16,
              borderRadius: 12,
              marginRight: 12,
              alignItems: "center",
              backgroundColor: colors.surfaceSecondary,
            }} 
            onPress={onCancel} 
                disabled={isSubmitting}
              >
            <Text style={{ fontWeight: "500", color: colors.textSecondary }}>
              İptal
            </Text>
              </TouchableOpacity>

              <TouchableOpacity 
            style={{
              flex: 1,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              backgroundColor: isSubmitting ? colors.textMuted : colors.primary,
              opacity: isSubmitting ? 0.7 : 1,
            }} 
                onPress={handleSubmit} 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
              <Loader color={colors.primaryForeground} size={20} />
                ) : (
              <Check color={colors.primaryForeground} size={20} />
                )}
            <Text style={{ fontWeight: "500", marginLeft: 8, color: colors.primaryForeground }}>
                  {isSubmitting ? "Gönderiliyor..." : "Rapor Oluştur"}
                </Text>
              </TouchableOpacity>
            </View>
        {/* Preview Modal */}
        <PhotoPreviewModal uri={previewUri} onClose={() => setPreviewUri(null)} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}