// Angular HTTP interceptor for license validation
import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class LicenseInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const licenseKey = localStorage.getItem('licenseKey');
    let cloned = req;
    if (licenseKey) {
      cloned = req.clone({
        setHeaders: { 'x-license-key': licenseKey }
      });
    }
    return next.handle(cloned).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 403 && error.error?.error === 'Invalid license') {
          // Handle license error (e.g., redirect, show message)
          alert('License validation failed: ' + (error.error.reason || '')); 
        }
        return throwError(() => error);
      })
    );
  }
}
