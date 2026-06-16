import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async getUserHistory(userId: string) {
    try {
      const historyRef = this.firebaseService.firestore
        .collection('users')
        .doc(userId)
        .collection('history')
        .orderBy('date', 'desc');

      const snapshot = await historyRef.get();
      const history: any[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        let dateISO = null;
        if (data.date) {
          if (typeof data.date.toDate === 'function') {
            dateISO = data.date.toDate().toISOString();
          } else {
            try { dateISO = new Date(data.date).toISOString(); } catch(e) {}
          }
        }
        history.push({
          id: doc.id,
          ...data,
          date: dateISO
        });
      });

      return history;
    } catch (error: any) {
      this.logger.error(`Failed to fetch history for user ${userId}: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch user history');
    }
  }

  async getHistoryById(userId: string, jobId: string) {
    try {
      const doc = await this.firebaseService.firestore
        .collection('users')
        .doc(userId)
        .collection('history')
        .doc(jobId)
        .get();
      
      if (!doc.exists) throw new Error('Not found');
      
      const data = doc.data();
      let dateISO = null;
      if (data?.date) {
        if (typeof data.date.toDate === 'function') {
          dateISO = data.date.toDate().toISOString();
        } else {
          try { dateISO = new Date(data.date).toISOString(); } catch(e) {}
        }
      }

      return {
        id: doc.id,
        ...data,
        date: dateISO
      };
    } catch (error: any) {
      this.logger.error(`Failed to fetch history details for job ${jobId}: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch history details');
    }
  }

  async deleteHistory(userId: string, jobId: string) {
    try {
      await this.firebaseService.firestore
        .collection('users')
        .doc(userId)
        .collection('history')
        .doc(jobId)
        .delete();
      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to delete history for job ${jobId}: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete history');
    }
  }
}
