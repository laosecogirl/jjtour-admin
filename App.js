import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, TextInput, ActivityIndicator, Dimensions, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';

const { width } = Dimensions.get('window');

// 📊 구글 시트의 [예약내역] 탭을 긁어오는 실시간 우회 주소
const ADMIN_SHEET_URL = 'https://opensheet.elk.sh/1Hz3YK59XlflTr9NXsawb72C4DogxWEnFcxkrRe3T9KU/예약내역';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [reservations, setReservations] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const ADMIN_PASSWORD = '7777'; 

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) { setIsLoggedIn(true); fetchReservations(); } 
    else { alert('비밀번호가 올바르지 않습니다!'); }
  };

  const fetchReservations = async () => {
    setIsDataLoading(true);
    try {
      const response = await fetch(ADMIN_SHEET_URL);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const sanitized = data.map((item, idx) => {
          const lowerItem = {};
          Object.keys(item).forEach(key => { lowerItem[key.trim().toLowerCase()] = item[key]; });

          return {
            id: lowerItem.id || String(idx + 1),
            name: lowerItem.name || '이름 정보 없음',
            phone: lowerItem.phone || 'ID 정보 없음', 
            product: lowerItem.product || '상품 정보 없음',
            date: lowerItem.date || '날짜 없음',
            people: lowerItem.people || '미지정' // 인원수 필드 매칭 추가
          };
        });
        setReservations(sanitized.reverse());
      }
      setIsDataLoading(false);
    } catch (error) {
      console.error("데이터 읽기 실패:", error);
      setIsDataLoading(false);
    }
  };

  const connectTelegram = (userId) => {
    if (!userId || userId.includes('정보 없음')) { alert('유효한 ID가 아닙니다.'); return; }
    const cleanId = userId.trim().replace('@', '');
    Linking.openURL(`https://t.me{cleanId}`).catch(() => { alert('텔레그램 앱을 열 수 없습니다.'); });
  };

  const copyToClipboard = async (userId) => {
    if (!userId || userId.includes('정보 없음')) { alert('복사할 ID가 없습니다.'); return; }
    await Clipboard.setStringAsync(userId.trim());
    alert(`카톡 ID 복사 완료!\n[ ${userId} ]`);
  };
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
        <View style={styles.loginBox}>
          <Text style={styles.loginLogo}>JJ TOUR</Text>
          <Text style={styles.loginSubTitle}>⚡ 관리자 전용 어플리케이션</Text>
          <TextInput style={styles.loginInput} placeholder="관리자 비밀번호를 입력하세요" placeholderTextColor="#999" secureTextEntry={true} value={password} onChangeText={setPassword} />
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.8}><Text style={styles.loginButtonText}>로그인</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 JJ TOUR 예약 현황</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchReservations}><Text style={styles.refreshButtonText}>🔄 새로고침</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>총 신청 건수: <Text style={{fontWeight:'bold', color:'#e74c3c'}}>{reservations.length}</Text>건</Text>
        </View>

        {isDataLoading ? (
          <ActivityIndicator size="large" color="#2c3e50" style={{ marginTop: 50 }} />
        ) : reservations.length === 0 ? (
          <View style={styles.emptyView}><Text style={styles.emptyText}>아직 접수된 예약 신청이 없습니다. 📭</Text></View>
        ) : (
          reservations.map((item) => (
            <View key={item.id} style={styles.reservationCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.customerName}>👤 {item.name} 고객님</Text>
                <Text style={styles.orderDate}>{item.date}</Text>
              </View>
              <View style={styles.divider} />
              
              <Text style={styles.infoLabel}>⛳ 신청 상품</Text>
              <Text style={styles.productName}>{item.product}</Text>
              
              {/* 👥 예약 인원 표시 칸 추가 */}
              <Text style={styles.infoLabel}>👥 예약 인원</Text>
              <Text style={[styles.productName, {color:'#2ecc71'}]}>{item.people}명</Text>
              
              <Text style={styles.infoLabel}>💬 고객 메신저 ID</Text>
              <Text style={styles.phoneNumber}>{item.phone}</Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#0088cc', marginRight: 5 }]} onPress={() => connectTelegram(item.phone)} activeOpacity={0.8}>
                  <Text style={styles.actionButtonText}>✈️ 텔레그램</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#f9e000', marginLeft: 5 }]} onPress={() => copyToClipboard(item.phone)} activeOpacity={0.8}>
                  <Text style={[styles.actionButtonText, { color: '#3c1e1e' }]}>💬 카톡 복사</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  loginContainer: { flex: 1, backgroundColor: '#2c3e50', justifyContent: 'center', alignItems: 'center' },
  loginBox: { width: width * 0.85, padding: 25, backgroundColor: '#ffffff', borderRadius: 12, alignItems: 'center', elevation: 5 },
  loginLogo: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', marginBottom: 5 },
  loginSubTitle: { fontSize: 14, color: '#7f8c8d', marginBottom: 30 },
  loginInput: { width: '100%', height: 48, borderWidth: 1, borderColor: '#bdc3c7', borderRadius: 6, paddingHorizontal: 15, marginBottom: 15, fontSize: 14, textAlign: 'center', color: '#333' },
  loginButton: { width: '100%', height: 48, backgroundColor: '#2c3e50', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  loginButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { height: 60, backgroundColor: '#2c3e50', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  refreshButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#34495e', borderRadius: 4 },
  refreshButtonText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  content: { padding: 15, paddingBottom: 40 },
  summaryBox: { backgroundColor: '#ffffff', padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  summaryText: { fontSize: 15, color: '#333' },
  emptyView: { marginTop: 100, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#7f8c8d' },
  reservationCard: { backgroundColor: '#ffffff', borderRadius: 10, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerName: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  orderDate: { fontSize: 12, color: '#95a5a6' },
  divider: { height: 1, backgroundColor: '#f1f3f5', marginVertical: 12 },
  infoLabel: { fontSize: 12, color: '#7f8c8d', marginBottom: 3, fontWeight: '600' },
  productName: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  phoneNumber: { fontSize: 14, fontWeight: 'bold', color: '#e67e22', marginBottom: 15 },
  actionButton: { flex: 1, paddingVertical: 12, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' }
});
