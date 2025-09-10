export type Database = {
  public: {
    Tables: {
      tax_transactions: {
        Row: {
          id: string;
          user_id: string;
          transaction_date: string;
          transaction_type: '매입' | '매출';
          supplier_name: string;
          business_number?: string;
          supply_amount: number;
          vat_amount: number;
          total_amount: number;
          description?: string;
          project_id?: string;
          client_id?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Row, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Row>;
      };
      tax_monthly_summary: {
        Row: {
          id: string;
          user_id: string;
          year: number;
          month: number;
          total_sales: number;
          total_purchases: number;
          vat_payable: number;
          withholding_tax_collected: number;
          withholding_tax_paid: number;
          created_at: string;
          updated_at: string;
        };
      };
      tax_categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'income' | 'expense';
          description?: string;
          created_at: string;
        };
      };
      tax_reports: {
        Row: {
          id: string;
          user_id: string;
          report_type: string;
          year: number;
          month?: number;
          quarter?: number;
          data: any;
          created_at: string;
        };
      };
    };
  };
};

type Row = Database['public']['Tables']['tax_transactions']['Row'];
