import { CommonModule, CurrencyPipe, NgFor, NgIf, PercentPipe } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterOutlet } from '@angular/router';

interface CurrentExchangeRateResponse {
  exchangeRate: number;
  fromSymbol: string;
  toSymbol: string;
  lastUpdatedAt: string;
  success: boolean;
}
interface DailyExchangeRateResponse {
  open: number;
  high: number;
  low: number;
  close: number;
  date: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    FormsModule,
    HttpClientModule,
    NgIf,
    NgFor,
    CurrencyPipe,
    PercentPipe,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  protected readonly title = signal('brl-exchange-rate');

  isHistoryOpen: boolean = false;
  currencyCode: string = '';
  exchangeData: CurrentExchangeRateResponse | null = null;
  dailyData: DailyExchangeRateResponse[] = [];


  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  cleanExchangeRate() {
    this.exchangeData = null;
    this.dailyData = [];
    this.currencyCode = '';

  }

  getCurrentExchangeRate() {
    const code = this.currencyCode.trim().toUpperCase();

    if (!code) return;

    const apiKey = 'RVZG0GHEV2KORLNA';
    const url = `https://api-brl-exchange.actionlabs.com.br/api/1.0/open/currentExchangeRate?apiKey=${apiKey}&from_symbol=BRL&to_symbol=${code}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        console.log(res);
        this.exchangeData = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro na API:', err);
        this.exchangeData = null;
        this.cdr.detectChanges();
      }
    });

    this.dailyData = [];
    this.isHistoryOpen = false;
    this.cdr.detectChanges();
  }

  toggleDailyExchangeRate() {
    this.isHistoryOpen = !this.isHistoryOpen;

    if (this.isHistoryOpen && this.dailyData.length === 0) {
      this.getDailyExchangeRate();
    }
  }

  getDailyExchangeRate() {
    const code = this.currencyCode.trim().toUpperCase();
    if (!code) return;

    const apiKey = 'RVZG0GHEV2KORLNA';
    const url = `https://api-brl-exchange.actionlabs.com.br/api/1.0/open/dailyExchangeRate?apiKey=${apiKey}&from_symbol=BRL&to_symbol=${code}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        const allData: DailyExchangeRateResponse[] = res.data;

        console.log(allData);

        if (allData.length === 0) {
          this.dailyData = [];
          this.cdr.detectChanges();
          return;
        }

        const today = new Date();

        const daysToShow = 32;
        const filledData: DailyExchangeRateResponse[] = [];

        for (let i = 0; i < daysToShow; i++) {
          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() - i);

          const targetDateStr = targetDate.toISOString().slice(0, 10);

          const dayData = allData.find(d => d.date.startsWith(targetDateStr));

          if (dayData) {
            filledData.push(dayData);
          }
        }

        this.dailyData = filledData;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro na API:', err);
        this.dailyData = [];
        this.cdr.detectChanges();
      }
    });
  }

  getCloseDiff(index: number): number | null {
    if (index >= this.dailyData.length - 1) return null;

    const todayClose = this.dailyData[index].close;
    const previousClose = this.dailyData[index + 1].close;

    return todayClose - previousClose;
  }

  formatDateAndHour(dateString: string): string {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} - ${hours}h${minutes}`;
  }
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();


    return `${day}/${month}/${year}`;
  }
}
