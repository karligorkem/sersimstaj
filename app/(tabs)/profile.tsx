import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '~/hooks/useTheme';
import { useAuth, User } from '~/contexts/AuthContext';
import { useToast } from '~/contexts/ToastContext';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import LogoLight from '~/assets/images/sersim-light.svg';
import LogoDark from '~/assets/images/sersim-dark.svg';
import { User as UserIcon, Edit, Trash2, PlusCircle, AlertCircle, Building2 } from 'lucide-react-native';
import { ErrorCodeDto, LineDto } from '~/types'; 
import { UsersService, User as ServiceUser, CreateUserPayload } from '~/services/users.service';
import { ErrorCodeService } from '~/services/errorCode.service';
import { LineService } from '~/services/line.service';

// --- Bileşenler ---

const UserInfoCard = ({ user, isAdmin }: { user: User | null; isAdmin: boolean }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [userLine, setUserLine] = useState<LineDto | null>(null);
  const [isLoadingLine, setIsLoadingLine] = useState(true);

  useEffect(() => {
    const fetchUserLine = async () => {
      if (!user?.line) {
        setIsLoadingLine(false);
        return;
      }

      try {
        setIsLoadingLine(true);
        const response = await LineService.getLines();
        
        // Kullanıcının line ID'sine göre doğru line'ı bul
        const lineIdMatch = user.line.match(/Line (\d+)/);
        if (lineIdMatch) {
          const lineId = parseInt(lineIdMatch[1]);
          const foundLine = response.data.find(line => line.id === lineId);
          setUserLine(foundLine || null);
        }
      } catch (error) {
        console.error("Kullanıcı line bilgisi alınamadı:", error);
        setUserLine(null);
      } finally {
        setIsLoadingLine(false);
      }
    };

    fetchUserLine();
  }, [user?.line]);

  return (
    <View style={styles.userInfoCard}>
      <View style={styles.userAvatar}>
        <UserIcon size={40} color={colors.primaryForeground} />
      </View>
      <Text style={styles.userName}>{user?.username || 'Kullanıcı'}</Text>
      <Text style={styles.userRole}>
        {isAdmin ? 'Yönetici' : 'Çalışan'}
      </Text>
      {/* Çalışma Bandı Bilgisi */}
      {user?.line && (
        <View style={styles.lineInfo}>
          <Text style={styles.lineLabel}>Çalışma Bandı:</Text>
          <Text style={styles.lineName}>
            {isLoadingLine ? 'Yükleniyor...' : (userLine ? userLine.name : 'Bilgi bulunamadı')}
          </Text>
        </View>
      )}
    </View>
  );
};

const AdminPanel = ({ isSuperAdmin }: { isSuperAdmin: boolean }) => {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const styles = getStyles(colors);

  const [users, setUsers] = useState<ServiceUser[]>([]);
  const [errorCodes, setErrorCodes] = useState<ErrorCodeDto[]>([]);
  const [lines, setLines] = useState<LineDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [isUserModalVisible, setUserModalVisible] = useState(false);
  const [isErrorModalVisible, setErrorModalVisible] = useState(false);
  const [isLineModalVisible, setLineModalVisible] = useState(false);

  const [editingUser, setEditingUser] = useState<ServiceUser | null>(null);
  const [editingErrorCode, setEditingErrorCode] = useState<ErrorCodeDto | null>(null);
  const [editingLine, setEditingLine] = useState<LineDto | null>(null);
  
  const [tempUsername, setTempUsername] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [tempRole, setTempRole] = useState<'SuperAdmin' | 'admin' | 'User'>('User');
  const [tempLine, setTempLine] = useState('');
  
  const [tempCode, setTempCode] = useState('');
  const [tempDescription, setTempDescription] = useState('');
  
  const [tempLineName, setTempLineName] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Her servisi ayrı ayrı çağır ve hataları yakala
      try {
        const usersResponse = await UsersService.getUsers();
        setUsers(usersResponse);
        console.log('Users loaded successfully:', usersResponse.length);
      } catch (userError) {
        console.error('Users loading failed:', userError);
        setUsers([]);
        showToast('Kullanıcı listesi yüklenemedi - yetki yok', 'warning', 3000);
      }

      try {
        const errorCodesResponse = await ErrorCodeService.getErrorCodes();
        setErrorCodes(errorCodesResponse.data);
        console.log('Error codes loaded successfully:', errorCodesResponse.data.length);
      } catch (errorCodeError) {
        console.error('Error codes loading failed:', errorCodeError);
        setErrorCodes([]);
        showToast('Hata kodları yüklenemedi', 'warning', 3000);
      }

      try {
        const linesResponse = await LineService.getLines();
        setLines(linesResponse.data);
        console.log('Lines loaded successfully:', linesResponse.data.length);
      } catch (lineError) {
        console.error('Lines loading failed:', lineError);
        setLines([]);
        showToast('Bant listesi yüklenemedi', 'warning', 3000);
      }

    } catch (error) {
      console.error('General fetch error:', error);
      showToast('Veriler yüklenirken bir sorun oluştu', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openUserModal = (user: ServiceUser | null) => {
    setEditingUser(user);
    setTempUsername(user?.username || '');
    setTempPassword('');
    setTempRole(user?.role || 'User');
    setTempLine(user?.line || '');
    setUserModalVisible(true);
  };

  const openLineModal = (line: LineDto | null) => {
    setEditingLine(line);
    setTempLineName(line?.name || '');
    setLineModalVisible(true);
  };

  const handleSaveUser = async () => {
    if (!tempUsername) {
      showToast('Kullanıcı adı boş olamaz', 'warning', 3000);
      return;
    }
    try {
      const userData: CreateUserPayload = {
        username: tempUsername,
        password: tempPassword || '',
        role: tempRole,
        lineId: tempLine ? parseInt(tempLine) : undefined,
      };

      if (editingUser) {
        await UsersService.updateUser(editingUser.id, userData);
      } else {
        if (!userData.password) {
          showToast('Yeni kullanıcı için şifre zorunludur', 'warning', 3000);
          return;
        }
        await UsersService.addUser(userData);
      }
      setUserModalVisible(false);
      await fetchData();
    } catch (error) {
      showToast('Kullanıcı kaydedilemedi', 'error', 3000);
    }
  };

  const handleDeleteUser = (user: ServiceUser) => {
    Alert.alert(
      'Kullanıcıyı Sil',
      `'${user.username}' adlı kullanıcıyı silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await UsersService.deleteUser(user.id);
              await fetchData();
            } catch (error) {
              Alert.alert('Hata', 'Kullanıcı silinemedi.');
            }
          },
        },
      ]
    );
  };

  const handleSaveLine = async () => {
    if (!tempLineName) {
      showToast('Bant adı boş olamaz', 'warning', 3000);
      return;
    }
    try {
      const lineData = { 
        id: editingLine ? editingLine.id : 0, 
        name: tempLineName 
      };

      if (editingLine) {
        await LineService.updateLine(lineData);
      } else {
        await LineService.createLine(lineData);
      }
      setLineModalVisible(false);
      await fetchData();
    } catch (error) {
      showToast('Bant kaydedilemedi', 'error', 3000);
    }
  };

  const handleDeleteLine = (line: LineDto) => {
    Alert.alert(
      'Bantı Sil',
      `'${line.name}' bantını silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await LineService.deleteLine(line.id);
              await fetchData();
            } catch (error) {
              Alert.alert('Hata', 'Bant silinemedi.');
            }
          },
        },
      ]
    );
  };

  const openErrorModal = (errorCode: ErrorCodeDto | null) => {
    setEditingErrorCode(errorCode);
    setTempCode(errorCode?.code || '');
    setTempDescription(errorCode?.description || '');
    setErrorModalVisible(true);
  }

  const handleSaveErrorCode = async () => {
    if (!tempCode || !tempDescription) {
      Alert.alert('Uyarı', 'Hata kodu ve açıklaması boş olamaz.');
      return;
    }
    try {
      const errorCodeData = { 
        id: editingErrorCode ? editingErrorCode.id : 0, 
        code: tempCode, 
        description: tempDescription 
      };

      if (editingErrorCode) {
        await ErrorCodeService.updateErrorCode(errorCodeData);
      } else {
        await ErrorCodeService.createErrorCode(errorCodeData);
      }
      setErrorModalVisible(false);
      await fetchData();
    } catch (error) {
       Alert.alert('Hata', 'Hata kodu kaydedilemedi.');
    }
  }
  
  const handleDeleteErrorCode = (errorCode: ErrorCodeDto) => {
    Alert.alert(
      'Hata Kodunu Sil',
      `'${errorCode.code}' kodunu silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await ErrorCodeService.deleteErrorCode(errorCode.id);
              await fetchData();
            } catch (error) {
              Alert.alert('Hata', 'Hata kodu silinemedi.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />;
  }

  return (
    <ScrollView>
      {/* Kullanıcı Yönetimi - Sadece SuperAdmin'lere göster */}
      {isSuperAdmin && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kullanıcı Yönetimi</Text>
            <Button size="sm" onPress={() => openUserModal(null)}>
              <PlusCircle size={16} color={colors.primaryForeground} />
              <Text className="ml-2">Kullanıcı Ekle</Text>
            </Button>
          </View>
          {users.map((user) => (
            <View key={user.id} style={styles.itemCard}>
              <UserIcon size={24} color={colors.primary} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{user.username}</Text>
                <Text style={styles.itemDetail}>{user.role} - {user.line || 'Bant Yok'}</Text>
              </View>
              <View style={styles.itemActions}>
                <TouchableOpacity onPress={() => openUserModal(user)}>
                  <Edit size={20} color={colors.accent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteUser(user)}>
                  <Trash2 size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hata Kodu Yönetimi</Text>
           <Button size="sm" onPress={() => openErrorModal(null)}>
            <PlusCircle size={16} color={colors.primaryForeground} />
            <Text className="ml-2">Hata Kodu Ekle</Text>
          </Button>
        </View>
        {errorCodes.map((code) => (
           <View key={code.id} style={styles.itemCard}>
            <AlertCircle size={24} color={colors.error} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{code.code}</Text>
              <Text style={styles.itemDetail}>{code.description}</Text>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity onPress={() => openErrorModal(code)}>
                <Edit size={20} color={colors.accent} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteErrorCode(code)}>
                <Trash2 size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Çalışma Bandı Yönetimi - Sadece SuperAdmin'lere göster */}
      {isSuperAdmin && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Çalışma Bandı Yönetimi</Text>
            <Button size="sm" onPress={() => openLineModal(null)}>
              <PlusCircle size={16} color={colors.primaryForeground} />
              <Text className="ml-2">Bant Ekle</Text>
            </Button>
          </View>
          {lines.map((line) => (
            <View key={line.id} style={styles.itemCard}>
              <Building2 size={24} color={colors.primary} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{line.name}</Text>
                <Text style={styles.itemDetail}>ID: {line.id}</Text>
              </View>
              <View style={styles.itemActions}>
                <TouchableOpacity onPress={() => openLineModal(line)}>
                  <Edit size={20} color={colors.accent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteLine(line)}>
                  <Trash2 size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <Modal visible={isUserModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}</Text>
            <Input placeholder="Kullanıcı Adı" value={tempUsername} onChangeText={setTempUsername} className="mb-3" />
            <Input placeholder="Yeni Şifre (isteğe bağlı)" value={tempPassword} onChangeText={setTempPassword} secureTextEntry className="mb-3" />
            
            <Text style={styles.label}>Rol:</Text>
            <View style={styles.roleSelector}>
                <TouchableOpacity
                    style={[styles.roleButton, tempRole === 'User' && styles.roleButtonSelected]}
                    onPress={() => setTempRole('User')}
                >
                    <Text style={[styles.roleButtonText, tempRole === 'User' && styles.roleButtonTextSelected]}>Çalışan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.roleButton, tempRole === 'admin' && styles.roleButtonSelected]}
                    onPress={() => setTempRole('admin')}
                >
                    <Text style={[styles.roleButtonText, tempRole === 'admin' && styles.roleButtonTextSelected]}>Admin</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.roleButton, tempRole === 'SuperAdmin' && styles.roleButtonSelected]}
                    onPress={() => setTempRole('SuperAdmin')}
                >
                    <Text style={[styles.roleButtonText, tempRole === 'SuperAdmin' && styles.roleButtonTextSelected]}>SuperAdmin</Text>
                </TouchableOpacity>
            </View>

            <Input placeholder="Bant" value={tempLine} onChangeText={setTempLine} className="mb-4" />

            <View style={styles.modalActions}>
              <Button variant="secondary" onPress={() => setUserModalVisible(false)} className="flex-1">
                <Text>İptal</Text>
              </Button>
              <Button onPress={handleSaveUser} className="flex-1">
                <Text>Kaydet</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isErrorModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingErrorCode ? 'Hata Kodu Düzenle' : 'Yeni Hata Kodu Ekle'}</Text>
            <Input placeholder="Hata Kodu (örn: E001)" value={tempCode} onChangeText={setTempCode} className="mb-3" />
            <Input placeholder="Açıklama" value={tempDescription} onChangeText={setTempDescription} className="mb-4" />
            
            <View style={styles.modalActions}>
              <Button variant="secondary" onPress={() => setErrorModalVisible(false)} className="flex-1">
                <Text>İptal</Text>
              </Button>
              <Button onPress={handleSaveErrorCode} className="flex-1">
                <Text>Kaydet</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isLineModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingLine ? 'Bant Düzenle' : 'Yeni Bant Ekle'}</Text>
            <Input placeholder="Bant Adı" value={tempLineName} onChangeText={setTempLineName} className="mb-4" />
            
            <View style={styles.modalActions}>
              <Button variant="secondary" onPress={() => setLineModalVisible(false)} className="flex-1">
                <Text>İptal</Text>
              </Button>
              <Button onPress={handleSaveLine} className="flex-1">
                <Text>Kaydet</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// --- Ana Sayfa Bileşeni ---

const ProfilePage = () => {
  const { colors, isDark } = useTheme();
  const { user, signOut } = useAuth();
  const { showToast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Hata', 'Çıkış yapılırken bir sorun oluştu.');
    }
  };

  const isAdmin = user?.role === 'SuperAdmin' || user?.role === 'admin' || user?.role === 'Admin';
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const styles = getStyles(colors);


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {isDark ? <LogoDark width={150} height={60} /> : <LogoLight width={150} height={60} />}
      </View>
      
      <UserInfoCard user={user} isAdmin={isAdmin} />

      <View style={styles.content}>
        {isAdmin ? <AdminPanel isSuperAdmin={isSuperAdmin} /> : <View style={{ flex: 1 }} />}
      </View>
      
      <View style={styles.footer}>
         <Button variant="destructive" className="w-full" onPress={handleSignOut}>
          <Text>Çıkış Yap</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
};

// --- Stil Tanımlamaları ---

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    userInfoCard: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      padding: 24,
      borderRadius: 16,
      alignItems: 'center',
      marginBottom: 16,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    userAvatar: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    userName: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
    },
    userRole: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 4,
    },
    lineInfo: {
      marginTop: 12,
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      width: '100%',
    },
    lineLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    lineName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    itemCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
      elevation: 1,
    },
    itemInfo: {
      flex: 1,
      marginLeft: 16,
    },
    itemName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    itemDetail: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    itemActions: {
      flexDirection: 'row',
      gap: 20,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalContent: {
      width: '90%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 20,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 8,
    },
    label: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      marginLeft: 4,
    },
    roleSelector: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    roleButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    roleButtonSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    roleButtonText: {
        color: colors.text,
    },
    roleButtonTextSelected: {
        color: colors.primaryForeground,
        fontWeight: 'bold',
    },
  });

export default ProfilePage;