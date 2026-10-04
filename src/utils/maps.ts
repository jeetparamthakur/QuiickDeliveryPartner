import { Linking, Platform } from 'react-native';

export function openMapsNavigation(latitude: number, longitude: number, label?: string) {
  const encodedLabel = encodeURIComponent(label ?? 'Destination');
  const url =
    Platform.OS === 'ios'
      ? `maps:0,0?q=${encodedLabel}@${latitude},${longitude}`
      : `google.navigation:q=${latitude},${longitude}`;
  Linking.openURL(url).catch(() => {
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    );
  });
}

export function openSupportWhatsApp(phone = '919999999999') {
  Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent('Hi, I need help with a delivery.')}`);
}

export function openSupportEmail(email = 'support@quiick.app') {
  Linking.openURL(`mailto:${email}?subject=${encodeURIComponent('Delivery partner support')}`);
}
