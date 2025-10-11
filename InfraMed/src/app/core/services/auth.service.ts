import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { TokenService } from './token.service';
import { Router } from '@angular/router';
import { API_CONFIG } from '../../config/API_CONFIG';
import { UsuarioAutenticado } from '../types/UsuarioAutenticado';
import { LoginRequest } from '../types/LoginRequest';
import { TokenResponse } from '../types/TokenResponse';

const statusAutenticacaoInicial: UsuarioAutenticado = {
  username: '',
  exp: 0,
  iat: 0,
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private router = inject(Router);
  private statusAutenticacao$ = new BehaviorSubject<UsuarioAutenticado>(
    statusAutenticacaoInicial
  );
  readonly statusAutenticacao = this.statusAutenticacao$.asObservable();

  autenticar(form: LoginRequest): Observable<HttpResponse<TokenResponse>> {
    return this.http
      .post<TokenResponse>(`${API_CONFIG.baseUrl}/auth/login`, form, {
        observe: 'response',
      })
      .pipe(
        tap((response) => {
          const token = response.body?.token || '';
          this.setUsuarioAutenticado(token);
          this.router.navigate(['app/home']);
        })
      );
  }

  logout(): void {
    this.limparUsuarioAutenticado();
    this.router.navigate(['']);
  }

  setUsuarioAutenticado(token: string): void {
    this.tokenService.salvarToken(token);
    const usuarioAutenticado: UsuarioAutenticado = this.getUsuarioAutenticado();
    try {
      this.statusAutenticacao$.next(usuarioAutenticado);
    } catch (error) {
      console.error('Erro ao decodificar o token: ', error);
      this.limparUsuarioAutenticado();
    }
  }

  limparUsuarioAutenticado(): void {
    this.statusAutenticacao$.next(statusAutenticacaoInicial);
    this.tokenService.excluirToken();
  }

  getUsuarioAutenticado(): UsuarioAutenticado {
    return {
      username: this.tokenService.getUsername(),
      exp: this.tokenService.getExp(),
      iat: this.tokenService.getIat(),
    };
  }
}
