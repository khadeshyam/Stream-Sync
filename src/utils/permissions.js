import { PermissionsAndroid } from 'react-native';

export const requestCamAudioPermissions = async () => {
  try {
    const permissions = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);

    const grantedCamera = permissions[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
    const grantedAudio = permissions[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;

    return grantedCamera && grantedAudio;
  } catch (err) {
    console.warn(err);
    return false;
  }
};