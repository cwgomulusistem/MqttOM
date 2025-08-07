import { Injectable, signal } from '@angular/core';

/**
 * Kullanıcı kimlik doğrulama ve yetkilendirme bilgilerini yönetir.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /**
   * Mevcut kullanıcının tenant kimliğini tutan sinyal.
   * Bu değer, kullanıcı giriş yaptıktan sonra setTenant metodu ile ayarlanır.
   */
  public readonly tenant = signal<string | null>(null);

  /**
   * Kullanıcı giriş yaptığında tenant kimliğini ayarlar.
   * @param tenant - Giriş yapan kullanıcıya ait tenant kimliği.
   */
  public setTenant(tenant: string): void {
    if (!tenant) {
      console.error('[AuthService] Tenant ID cannot be empty or null.');
      return;
    }
    this.tenant.set(tenant);
    console.log(`[AuthService] Tenant set to: ${tenant}`);
  }

  /**
   * Mevcut tenant kimliğini temizler (çıkış yapıldığında kullanılır).
   */
  public clearTenant(): void {
    this.tenant.set(null);
  }
}
