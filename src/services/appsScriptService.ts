import { LoanContract } from '../types/loan';
import { APPS_SCRIPT_CODE_GS, APPS_SCRIPT_INDEX_HTML } from './appsScriptTemplate';

export interface GasApiResponse<T = any> {
  status: 'success' | 'ok' | 'error';
  data?: T;
  message?: string;
  count?: number;
  timestamp?: string;
}

export class AppsScriptService {
  /**
   * Helper to normalize Google Apps Script Web App URL
   */
  private static cleanUrl(url: string): string {
    return url.trim();
  }

  /**
   * Test connection to Google Apps Script Web App
   */
  static async testConnection(webAppUrl: string): Promise<{ success: boolean; message: string }> {
    const url = this.cleanUrl(webAppUrl);
    if (!url) {
      return { success: false, message: 'กรุณาระบุ Google Apps Script Web App URL' };
    }
    if (!url.startsWith('https://script.google.com/')) {
      return { 
        success: false, 
        message: 'URL ต้องขึ้นต้นด้วย https://script.google.com/macros/s/.../exec' 
      };
    }

    try {
      const pingUrl = `${url}${url.includes('?') ? '&' : '?'}action=ping&_t=${Date.now()}`;
      const response = await fetch(pingUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const json = (await response.json()) as GasApiResponse;
      if (json.status === 'ok' || json.status === 'success') {
        return {
          success: true,
          message: json.message || 'เชื่อมต่อ Google Apps Script และ Google Sheets สำเร็จ!',
        };
      } else {
        return {
          success: false,
          message: json.message || 'Apps Script ตอบกลับสถานะไม่สำเร็จ',
        };
      }
    } catch (error: any) {
      console.error('Apps Script testConnection error:', error);
      return {
        success: false,
        message: `ไม่สามารถเชื่อมต่อได้: ${error.message || error}. กรุณาตรวจสอบว่าได้ Deploy Web App เป็น "Anyone" แล้วหรือยัง`,
      };
    }
  }

  /**
   * Fetch all contracts from Google Sheets via Apps Script
   */
  static async fetchContracts(webAppUrl: string): Promise<{ success: boolean; data?: LoanContract[]; message: string }> {
    const url = this.cleanUrl(webAppUrl);
    if (!url) {
      return { success: false, message: 'ยังไม่ได้ระบุ Web App URL' };
    }

    try {
      const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}action=getContracts&_t=${Date.now()}`;
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = (await response.json()) as GasApiResponse<LoanContract[]>;
      if (json.status === 'success' && Array.isArray(json.data)) {
        return {
          success: true,
          data: json.data,
          message: `ดึงข้อมูลจาก Google Sheets สำเร็จ (${json.data.length} สัญญา)`,
        };
      } else {
        return {
          success: false,
          message: json.message || 'ไม่สามารถแปลงข้อมูลจาก Google Sheets ได้',
        };
      }
    } catch (error: any) {
      console.error('Apps Script fetchContracts error:', error);
      return {
        success: false,
        message: `ข้อผิดพลาดในการดึงข้อมูล: ${error.message || error}`,
      };
    }
  }

  /**
   * Sync all contracts to Google Sheets (Full Push)
   * Note: Using text/plain avoids CORS preflight OPTIONS which Apps Script doesn't handle.
   */
  static async syncAllContracts(webAppUrl: string, contracts: LoanContract[]): Promise<{ success: boolean; message: string }> {
    const url = this.cleanUrl(webAppUrl);
    if (!url) {
      return { success: false, message: 'ยังไม่ได้ระบุ Web App URL' };
    }

    try {
      const payload = {
        action: 'syncAll',
        contracts,
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch(url, {
        method: 'POST',
        // 'text/plain' sends a simple POST request without CORS preflight
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = (await response.json()) as GasApiResponse;
      if (json.status === 'success') {
        return {
          success: true,
          message: json.message || `ซิงค์ข้อมูลสัญญาทั้งหมด ${contracts.length} รายการขึ้น Google Sheets สำเร็จ`,
        };
      } else {
        return {
          success: false,
          message: json.message || 'บันทึกข้อมูลไม่สำเร็จ',
        };
      }
    } catch (error: any) {
      console.error('Apps Script syncAllContracts error:', error);
      return {
        success: false,
        message: `ข้อผิดพลาดในการซิงค์ข้อมูล: ${error.message || error}`,
      };
    }
  }

  /**
   * Add a single contract to Google Sheets
   */
  static async addContract(webAppUrl: string, contract: LoanContract): Promise<{ success: boolean; message: string }> {
    const url = this.cleanUrl(webAppUrl);
    if (!url) return { success: false, message: 'ยังไม่ได้ระบุ Web App URL' };

    try {
      const payload = {
        action: 'addContract',
        contract,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      const json = (await response.json()) as GasApiResponse;
      return {
        success: json.status === 'success',
        message: json.message || 'บันทึกสัญญาใหม่ลง Google Sheets สำเร็จ',
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล' };
    }
  }

  /**
   * Update a single contract in Google Sheets
   */
  static async updateContract(webAppUrl: string, contract: LoanContract): Promise<{ success: boolean; message: string }> {
    const url = this.cleanUrl(webAppUrl);
    if (!url) return { success: false, message: 'ยังไม่ได้ระบุ Web App URL' };

    try {
      const payload = {
        action: 'updateContract',
        contract,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      const json = (await response.json()) as GasApiResponse;
      return {
        success: json.status === 'success',
        message: json.message || 'อัปเดตสัญญาใน Google Sheets สำเร็จ',
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'เกิดข้อผิดพลาดในการอัปเดต' };
    }
  }

  /**
   * Delete a single contract from Google Sheets
   */
  static async deleteContract(webAppUrl: string, contractId: string): Promise<{ success: boolean; message: string }> {
    const url = this.cleanUrl(webAppUrl);
    if (!url) return { success: false, message: 'ยังไม่ได้ระบุ Web App URL' };

    try {
      const payload = {
        action: 'deleteContract',
        id: contractId,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      const json = (await response.json()) as GasApiResponse;
      return {
        success: json.status === 'success',
        message: json.message || 'ลบสัญญาออกจาก Google Sheets สำเร็จ',
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'เกิดข้อผิดพลาดในการลบ' };
    }
  }

  /**
   * Google Apps Script template code for user to copy & paste into Code.gs
   */
  static getAppsScriptCode(): string {
    return APPS_SCRIPT_CODE_GS;
  }

  /**
   * Google Apps Script frontend HTML for user to copy & paste into Index.html
   */
  static getAppsScriptIndexHtml(): string {
    return APPS_SCRIPT_INDEX_HTML;
  }
}
