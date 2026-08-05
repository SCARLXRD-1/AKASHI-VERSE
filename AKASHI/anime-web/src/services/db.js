import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { sileo } from 'sileo';

// Obtiene los datos del usuario desde Firestore
export const getUserData = async (uid) => {
  if (!isFirebaseConfigured || !db) return null;
  
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data from Firestore:", error);
    sileo.error({ title: "Error de conexión", description: "No se pudieron cargar tus datos de la nube. Revisa las reglas de Firestore." });
    return null;
  }
};

// Guarda o actualiza los datos del usuario en Firestore
export const syncUserData = async (uid, data) => {
  if (!isFirebaseConfigured || !db || !uid) return;
  
  try {
    const docRef = doc(db, 'users', uid);
    // Usamos setDoc con merge: true para no sobrescribir datos de otros dispositivos si faltan campos
    await setDoc(docRef, {
      ...data,
      lastSyncedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error syncing user data to Firestore:", error);
    sileo.error({ title: "Error al guardar", description: "Tus cambios no se guardaron en la nube. Revisa las reglas de Firestore." });
  }
};
