import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  private collection = 'users';
  private readonly logger = new Logger(ProfileService.name);

  constructor(private readonly authService: AuthService) {}

  private get db() {
    return this.authService.getFirestore();
  }

  async syncProfile(user: any) {
    const docRef = this.db.collection(this.collection).doc(user.uid);
    let doc;

    try {
      doc = await docRef.get();
    } catch (error) {
      throw new InternalServerErrorException(`Failed to check existing profile: ${error.message}`);
    }

    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }

    const newProfile = {
      uid: user.uid,
      email: user.email || null,
      displayName: user.name || user.displayName || null,
      photoURL: user.picture || user.photoURL || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await docRef.set(newProfile);
    } catch (error) {
      throw new InternalServerErrorException(`Failed to create profile: ${error.message}`);
    }

    return { id: user.uid, ...newProfile };
  }

  async getProfile(uid: string) {
    let doc;
    try {
      doc = await this.db.collection(this.collection).doc(uid).get();
    } catch (error) {
      throw new InternalServerErrorException(`Failed to fetch profile from Firestore: ${error.message}`);
    }

    if (!doc.exists) {
      throw new NotFoundException(`Profile for user ${uid} not found`);
    }

    return { id: doc.id, ...doc.data() };
  }

  async updateProfile(uid: string, updateProfileDto: UpdateProfileDto) {
    const docRef = this.db.collection(this.collection).doc(uid);
    let doc;
    
    try {
      doc = await docRef.get();
    } catch (error) {
      throw new InternalServerErrorException(`Failed to check existing profile for update: ${error.message}`);
    }

    if (!doc.exists) {
      throw new NotFoundException(`Profile for user ${uid} not found`);
    }

    const updateData = {
      ...updateProfileDto,
      updatedAt: new Date().toISOString(),
    };

    try {
      await docRef.update(updateData);
    } catch (error) {
      throw new InternalServerErrorException(`Failed to update profile: ${error.message}`);
    }

    return { id: uid, ...doc.data(), ...updateData };
  }

  async deleteAccount(uid: string) {
    // Step 1: Delete the Firestore document first.
    // WHY: We delete the Firestore document before the Auth user to prevent orphaned 
    // data. If Auth is deleted first and Firestore deletion fails, the user is locked 
    // out and cannot retry the operation, leaving their data permanently undeleted.
    try {
      await this.db.collection(this.collection).doc(uid).delete();
    } catch (firestoreError) {
      throw new InternalServerErrorException(`Failed to delete user profile data: ${firestoreError.message}`);
    }

    // Step 2: Delete the Firebase Auth user.
    try {
      await this.authService.getAuth().deleteUser(uid);
    } catch (authError) {
      this.logger.error(`CRITICAL: Failed to delete Auth user ${uid} after Firestore profile deletion:`, authError);
      throw new InternalServerErrorException(`Failed to delete authentication record: ${authError.message}`);
    }

    return { success: true, message: 'Account successfully deleted' };
  }
}
