import { Injectable, signal } from '@angular/core';

/**
 * Kullanıcı kimlik doğrulama ve yetkilendirme bilgilerini yönetir.
 * Bu servis, mevcut kullanıcının 'tenant' kimliğini uygulama genelinde
 * erişilebilir bir sinyal olarak sağlar.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /**
   * Mevcut kullanıcının tenant kimliğini tutan sinyal.
   * Gerçek bir uygulamada bu değer, kullanıcı giriş yaptıktan sonra
   * dinamik olarak güncellenir.
   *
   * Varsayılan olarak 'CCTR' değeriyle başlatılmıştır.
   */
  public readonly tenant = signal<string>('CCTR');
}
