import firebase from '@react-native-firebase/app';
import '@react-native-firebase/firestore';

const app = firebase.app();
const db = app.firestore();

export {firebase,db};