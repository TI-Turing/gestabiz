import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AssignmentHealthPanelProps {
  servicesWithoutEmployees: number
  locationsWithoutServices: number
  employeesWithoutSupervisor: number
  employeesWithoutSchedule: number
  employeesWithoutServices: number
  regularEmployeesChecked: number
  onNavigate: (path: string) => void
}

interface IssueItem {
  key: string
  label: string
  value: number
  navigateTo: string
}

export function AssignmentHealthPanel({
  servicesWithoutEmployees,
  locationsWithoutServices,
  employeesWithoutSupervisor,
  employeesWithoutSchedule,
  employeesWithoutServices,
  regularEmployeesChecked,
  onNavigate,
}: Readonly<AssignmentHealthPanelProps>) {
  const issues: IssueItem[] = [
    {
      key: 'services-without-employees',
      label: 'Servicios sin empleados asignados',
      value: servicesWithoutEmployees,
      navigateTo: '/app/admin/services',
    },
    {
      key: 'locations-without-services',
      label: 'Sedes sin servicios asignados',
      value: locationsWithoutServices,
      navigateTo: '/app/admin/locations',
    },
    {
      key: 'employees-without-supervisor',
      label: 'Empleados sin jefe directo asignado',
      value: employeesWithoutSupervisor,
      navigateTo: '/app/admin/employees',
    },
    {
      key: 'employees-without-schedule',
      label: 'Empleados sin horario asignado',
      value: employeesWithoutSchedule,
      navigateTo: '/app/admin/employees',
    },
    {
      key: 'employees-without-services',
      label: 'Empleados sin servicios asignados',
      value: employeesWithoutServices,
      navigateTo: '/app/admin/employees',
    },
  ]

  const openIssues = issues.filter((issue) => issue.value > 0)
  const hasIssues = openIssues.length > 0

  return (
    <Card className={hasIssues ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            {hasIssues ? (
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="font-semibold text-foreground leading-tight">
                Validacion de asignaciones internas
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hasIssues
                  ? `Se detectaron ${openIssues.length} tipos de pendientes operativos.`
                  : 'No se detectaron pendientes operativos en servicios, sedes o empleados.'}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={hasIssues ? 'border-red-500/50 text-red-400 shrink-0' : 'border-green-500/50 text-green-400 shrink-0'}
          >
            {hasIssues ? 'Con pendientes' : 'Sin pendientes'}
          </Badge>
        </div>

        <div className="space-y-1">
          {issues.map((issue) => {
            const isDone = issue.value === 0

            return (
              <div
                key={issue.key}
                className="flex items-center justify-between gap-3 py-1.5 px-1 rounded-md"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isDone ? (
                    <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                  )}
                  <p className={`text-sm ${isDone ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                    {issue.label}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={isDone ? 'border-green-500/40 text-green-400' : 'border-red-500/40 text-red-400'}>
                    {issue.value}
                  </Badge>
                  {!isDone && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => onNavigate(issue.navigateTo)}
                    >
                      Revisar
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {regularEmployeesChecked > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            Empleados evaluados para reglas operativas: {regularEmployeesChecked} (se excluyen manager y owner).
          </p>
        )}
      </CardContent>
    </Card>
  )
}
