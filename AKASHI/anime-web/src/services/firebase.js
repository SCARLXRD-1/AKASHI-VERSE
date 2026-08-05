import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Tu configuración web de Firebase
// Para que esto funcione, debes reemplazar los valores en tu archivo .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validar que las variables existan para no crashear la app si el usuario aún no configura Firebase
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "AIzaSy... (Tu API Key real)" &&
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== "tu-proyecto"
);

export let auth = null;
export let db = null;
export let googleProvider = null;

if (isFirebaseConfigured) {
  // Inicializar Firebase
  let app = initializeApp(firebaseConfig);
  
  // Servicios
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Proveedores de autenticación
  googleProvider = new GoogleAuthProvider();
} else {
  console.warn("⚠️ Firebase no está configurado. La autenticación y guardado en la nube estarán deshabilitados. Por favor, configura tus credenciales en el archivo .env");
}
