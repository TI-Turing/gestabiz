import React, { useState, useMemo, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import supabase from '@/lib/supabase';
import { PermissionGate } from '@/components/ui/PermissionGate';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCategoryLabel } from '@/lib/categoryLabels';
import { useTransactions } from '@/hooks/useTransactions';
import { useChartData } from '@/hooks/useChartData';
import { useFinancialReports } from '@/hooks/useFinancialReports';
import { toast } from 'sonner';
import {
  IncomeVsExpenseChart,
  CategoryPieChart,
  MonthlyTrendChart,
  LocationBarChart,
  EmployeeRevenueChart,
} from '@/components/accounting';
import { formatCOP } from '@/lib/accounting/colombiaTaxes';
import { cn } from '@/lib/utils';
import type { Service, TransactionCategory } from '@/types/types';

interface EnhancedFinancialDashboardProps {
  businessId: string;
  locationId?: string;
  services?: Service[];
}

type Period = '1m' | '3m' | '6m' | '1y' | 'custom';

const CATEGORY_OPTIONS = [
  { value: 'appointment_payment', label: 'Pagos de citas' },
  { value: 'product_sale', label: 'Venta de productos' },
  { value: 'service_sale', label: 'Venta de servicios' },
  { value: 'membership', label: 'Membresías' },
  { value: 'salary', label: 'Salarios' },
  { value: 'commission', label: 'Comisiones' },
  { value: 'rent', label: 'Alquiler' },
  { value: 'utilities', label: 'Servicios públicos' },
  { value: 'supplies', label: 'Suministros' },
  { value: 'equipment', label: 'Equipos' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'tax', label: 'Impuestos' },
] as const;

export function EnhancedFinancialDashboard({
  businessId,
  locationId,
  services = [],
}: EnhancedFinancialDashboardProps) {
  const { t, language } = useLanguage();
  const [period, setPeriod] = useState<Period>('1m');
  const effectiveLocation = locationId || 'all';
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleEmployee = useCallback((empId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  }, []);

  const toggleCategory = useCallback((catValue: string) => {
    setSelectedCategories(prev =>
      prev.includes(catValue) ? prev.filter(v => v !== catValue) : [...prev, catValue]
    );
  }, []);

  const [employees, setEmployees] = useState<Array<{id: string; name: string}>>([]);
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case '1m':
        start.setMonth(start.getMonth() - 1);
        break;
      case '3m':
        start.setMonth(start.getMonth() - 3);
        break;
      case '6m':
        start.setMonth(start.getMonth() - 6);
        break;
      case '1y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setMonth(start.getMonth() - 1);
    }
    
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }, [period]);

  // Fetch transactions with filters
  const txFilters = useMemo(() => ({
    business_id: businessId,
    location_id: effectiveLocation !== 'all' ? effectiveLocation : undefined,
    employee_id: selectedEmployees.length > 0 ? selectedEmployees : undefined,
    category: selectedCategories.length > 0 ? (selectedCategories as TransactionCategory[]) : undefined,
    date_range: dateRange,
  }), [businessId, effectiveLocation, selectedEmployees, selectedCategories, dateRange]);

  const { summary, loading } = useTransactions(txFilters);

  // Cargar empleados del negocio filtrando por sede seleccionada
  useEffect(() => {
    const loadEmployees = async () => {
      let query = supabase
        .from('business_employees')
        .select('employee_id, profiles!business_employees_employee_id_fkey(id, full_name)')
        .eq('business_id', businessId)
        .eq('is_active', true);

      if (effectiveLocation !== 'all') {
        query = query.eq('location_id', effectiveLocation);
      }

      const { data } = await query;

      if (data && Array.isArray(data)) {
        const empList = data.map((emp) => {
          const profile = Array.isArray(emp.profiles) ? emp.profiles[0] : emp.profiles;
          return {
            id: emp.employee_id,
            name: profile?.full_name || 'Sin nombre',
          };
        });
        setEmployees(empList);
        // Limpiar empleados seleccionados que ya no están en la sede
        setSelectedEmployees(prev => prev.filter(id => empList.some(e => e.id === id)));
      }
    };
    loadEmployees();
  }, [businessId, effectiveLocation]);

  // Process chart data - usa filtros de tipo ReportFilters
  const reportFilters = useMemo(() => ({
    business_id: businessId,
    date_range: { start: dateRange.start, end: dateRange.end },
    location_id: effectiveLocation !== 'all' ? [effectiveLocation] : undefined,
    employee_id: selectedEmployees.length > 0 ? selectedEmployees : undefined,
    category: selectedCategories.length > 0 ? selectedCategories : undefined,
  }), [businessId, dateRange, effectiveLocation, selectedEmployees, selectedCategories]);
  
  const {
    incomeVsExpenseData,
    categoryDistributionData,
    monthlyTrendData,
    locationComparisonData,
    employeePerformanceData,
    loading: chartsLoading,
  } = useChartData(businessId, reportFilters);
  
  // Financial reports hook
  const { generateProfitAndLoss, exportToCSV, exportToExcel, exportToPDF } = useFinancialReports();

  // Labels for multi-select triggers (avoid nested ternaries in JSX)
  const employeeLabel = useMemo(() => {
    if (selectedEmployees.length === 0) return t('common.placeholders.allEmployees');
    if (selectedEmployees.length === 1) return employees.find(e => e.id === selectedEmployees[0])?.name ?? '1 empleado';
    return `${selectedEmployees.length} empleados`;
  }, [selectedEmployees, employees, t]);

  const categoryLabel = useMemo(() => {
    if (selectedCategories.length === 0) return t('common.placeholders.allCategories');
    if (selectedCategories.length === 1) return CATEGORY_OPTIONS.find(c => c.value === selectedCategories[0])?.label ?? '1 categoría';
    return `${selectedCategories.length} categorías`;
  }, [selectedCategories, t]);

  // Stats calculations
  const profitMargin = summary.total_income > 0
    ? ((summary.net_profit / summary.total_income) * 100).toFixed(1)
    : '0.0';

  const handleExportCSV = async () => {
    const toastId = toast.loading('Exportando a CSV...');
    try {
      const report = await generateProfitAndLoss(reportFilters);
      // Convertir el reporte a array para exportar
      const dataArray = [
        { item: 'Ingresos Totales', monto: report.total_income },
        ...report.income_by_category.map(cat => ({
          item: `  - ${getCategoryLabel(cat.category, language)}`,
          monto: cat.amount
        })),
        { item: 'Egresos Totales', monto: report.total_expenses },
        ...report.expenses_by_category.map(cat => ({
          item: `  - ${getCategoryLabel(cat.category, language)}`,
          monto: cat.amount
        })),
        { item: 'Utilidad Bruta', monto: report.gross_profit },
        { item: 'Utilidad Neta', monto: report.net_profit },
      ];
      exportToCSV(dataArray, `reporte_${period}`, { format: 'csv', delimiter: ';' });
      toast.success('Reporte CSV exportado exitosamente', { id: toastId });
    } catch (error) {
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { tags: { component: 'EnhancedFinancialDashboard' } })
      toast.error(`Error al exportar CSV: ${error instanceof Error ? error.message : 'Error desconocido'}`, { id: toastId });
    }
  };

  const handleExportExcel = async () => {
    const toastId = toast.loading('Exportando a Excel...');
    try {
      const report = await generateProfitAndLoss(reportFilters);
      const dataArray = [
        { item: 'Ingresos Totales', monto: report.total_income },
        ...report.income_by_category.map(cat => ({
          item: `  - ${getCategoryLabel(cat.category, language)}`,
          monto: cat.amount
        })),
        { item: 'Egresos Totales', monto: report.total_expenses },
        ...report.expenses_by_category.map(cat => ({
          item: `  - ${getCategoryLabel(cat.category, language)}`,
          monto: cat.amount
        })),
        { item: 'Utilidad Bruta', monto: report.gross_profit },
        { item: 'Utilidad Neta', monto: report.net_profit },
      ];
      exportToExcel(dataArray, `Reporte_Financiero_${period}`, 'Reporte');
      toast.success('Reporte Excel exportado exitosamente', { id: toastId });
    } catch (error) {
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { tags: { component: 'EnhancedFinancialDashboard' } })
      toast.error(`Error al exportar Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`, { id: toastId });
    }
  };

  const handleExportPDF = async () => {
    const toastId = toast.loading('Generando PDF...');
    try {
      const report = await generateProfitAndLoss(reportFilters);
      exportToPDF(report, report.business_name, `reporte_${period}.pdf`, language);
      toast.success('Reporte PDF generado exitosamente', { id: toastId });
    } catch (error) {
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { tags: { component: 'EnhancedFinancialDashboard' } })
      toast.error(`Error al generar PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`, { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {t('financial.dashboard')}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t('financial.dashboardDescription')}
            </p>
          </div>
          <PermissionGate permission="accounting.export" businessId={businessId} mode="hide">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
          </PermissionGate>
        </div>

        {/* Filters Row */}
        <Card className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Filtros:</span>
            </div>
            
            {/* Period Filter */}
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-36">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Último mes</SelectItem>
                <SelectItem value="3m">Últimos 3 meses</SelectItem>
                <SelectItem value="6m">Últimos 6 meses</SelectItem>
                <SelectItem value="1y">Último año</SelectItem>
              </SelectContent>
            </Select>

            {/* Employee Multi-Select */}
            {employees.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 w-52 justify-between font-normal">
                    <span className="truncate text-sm">{employeeLabel}</span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-1" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {employees.map(emp => (
                      <button
                        key={emp.id}
                        type="button"
                        className="flex w-full items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted cursor-pointer text-left"
                        onClick={() => toggleEmployee(emp.id)}
                      >
                        <Checkbox
                          checked={selectedEmployees.includes(emp.id)}
                          onCheckedChange={() => toggleEmployee(emp.id)}
                        />
                        <span className="truncate">{emp.name}</span>
                      </button>
                    ))}
                  </div>
                  {selectedEmployees.length > 0 && (
                    <div className="border-t mt-1 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-7 text-xs"
                        onClick={() => setSelectedEmployees([])}
                      >
                        Limpiar selección
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            )}

            {/* Category Multi-Select */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 w-52 justify-between font-normal">
                  <span className="truncate text-sm">{categoryLabel}</span>
                  <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {CATEGORY_OPTIONS.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      className="flex w-full items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted cursor-pointer text-left"
                      onClick={() => toggleCategory(cat.value)}
                    >
                      <Checkbox
                        checked={selectedCategories.includes(cat.value)}
                        onCheckedChange={() => toggleCategory(cat.value)}
                      />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
                {selectedCategories.length > 0 && (
                  <div className="border-t mt-1 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-xs"
                      onClick={() => setSelectedCategories([])}
                    >
                      Limpiar selección
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </Card>
      </div>

      {/* Main Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* Total Income */}
        <Card className="p-6 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {t('transactions.totalIncome')}
            </p>
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCOP(summary.total_income)}
              </p>
            )}
          </div>
        </Card>

        {/* Total Expenses */}
        <Card className="p-6 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {t('transactions.totalExpenses')}
            </p>
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCOP(summary.total_expenses)}
              </p>
            )}
          </div>
        </Card>

        {/* Net Profit */}
        <Card className="p-6 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {t('transactions.netProfit')}
            </p>
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <p
                className={cn(
                  'text-2xl font-bold',
                  summary.net_profit >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {formatCOP(summary.net_profit)}
              </p>
            )}
          </div>
        </Card>

        {/* Profit Margin */}
        <Card className="p-6 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {t('financial.profitMargin')}
            </p>
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {profitMargin}%
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="relative">
        {/* Loading overlay */}
        {chartsLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-background/70 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">Cargando datos...</p>
          </div>
        )}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="categories">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Por Categoría
          </TabsTrigger>
          <TabsTrigger value="locations">
            Por Sede
          </TabsTrigger>
          <TabsTrigger value="employees">
            Por Empleado
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6 bg-card">
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Ingresos vs Egresos
            </h3>
            <IncomeVsExpenseChart data={incomeVsExpenseData} height={350} />
          </Card>

          <Card className="p-6 bg-card">
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Tendencia Mensual
            </h3>
            <MonthlyTrendChart data={monthlyTrendData} height={350} showArea />
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6 bg-card">
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                Distribución por Categoría
              </h3>
              <CategoryPieChart data={categoryDistributionData} height={400} />
            </Card>

            <Card className="p-6 bg-card">
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                Desglose de Categorías
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {categoryDistributionData.map((cat) => (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div>
                        <p className="font-medium text-foreground">{cat.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {cat.count} {cat.count === 1 ? 'transacción' : 'transacciones'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {formatCOP(cat.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cat.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          <Card className="p-6 bg-card">
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Comparación por Sede
            </h3>
            <LocationBarChart data={locationComparisonData} height={400} />
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card className="p-6 bg-card">
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Rendimiento por Empleado
            </h3>
            <EmployeeRevenueChart data={employeePerformanceData} height={400} />
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
