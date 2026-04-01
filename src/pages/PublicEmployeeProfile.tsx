import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star, MapPin, Briefcase, ArrowLeft, Calendar, Copy, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// ─── Data fetch ───────────────────────────────────────────────────────────────

interface PublicEmployeeData {
  id: string;
  full_name: string;
  avatar_url: string | null;
  job_title: string | null;
  professional_summary: string | null;
  years_of_experience: number | null;
  specializations: string[];
  business: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  } | null;
  services: Array<{
    service_id: string;
    name: string;
    price: number;
    duration: number;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    client_name: string | null;
    client_avatar: string | null;
  }>;
  average_rating: number | null;
  total_reviews: number;
}

async function fetchPublicEmployee(employeeId: string): Promise<PublicEmployeeData> {
  // 1. Profile básico
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', employeeId)
    .single();
  if (profileErr) throw profileErr;

  // 2. Relación con negocio activo (toma el primero aprobado)
  const { data: empRow } = await supabase
    .from('business_employees')
    .select(`
      job_title,
      business_id,
      businesses:business_id (id, name, slug, logo_url)
    `)
    .eq('employee_id', employeeId)
    .eq('status', 'approved')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const bizRaw = empRow?.businesses;
  const business = bizRaw && !Array.isArray(bizRaw)
    ? { id: bizRaw.id, name: bizRaw.name, slug: bizRaw.slug, logo_url: bizRaw.logo_url ?? null }
    : Array.isArray(bizRaw) && bizRaw.length > 0
      ? { id: bizRaw[0].id, name: bizRaw[0].name, slug: bizRaw[0].slug, logo_url: bizRaw[0].logo_url ?? null }
      : null;

  // 3. Perfil profesional (reclutamiento)
  const { data: empProfile } = await supabase
    .from('employee_profiles')
    .select('professional_summary, years_of_experience, specializations')
    .eq('user_id', employeeId)
    .maybeSingle();

  // 4. Servicios que ofrece (filtrado por negocio si existe)
  let services: PublicEmployeeData['services'] = [];
  if (empRow?.business_id) {
    const { data: empServices } = await supabase
      .from('employee_services')
      .select('service_id, services(id, name, price, duration)')
      .eq('employee_id', employeeId)
      .eq('business_id', empRow.business_id);

    services = (empServices ?? [])
      .map((es) => {
        const svc = Array.isArray(es.services) ? es.services[0] : es.services;
        if (!svc) return null;
        return {
          service_id: es.service_id,
          name: svc.name as string,
          price: svc.price as number,
          duration: svc.duration as number,
        };
      })
      .filter(Boolean) as PublicEmployeeData['services'];
  }

  // 5. Reviews visibles del empleado
  const { data: reviewRows } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, client:profiles!reviews_client_id_fkey(full_name, avatar_url)')
    .eq('employee_id', employeeId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .limit(10);

  const reviews = (reviewRows ?? []).map((r) => {
    const client = Array.isArray(r.client) ? r.client[0] : r.client;
    return {
      id: r.id as string,
      rating: r.rating as number,
      comment: r.comment as string | null,
      created_at: r.created_at as string,
      client_name: (client?.full_name as string | null) ?? null,
      client_avatar: (client?.avatar_url as string | null) ?? null,
    };
  });

  const average_rating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : null;

  return {
    id: profile.id,
    full_name: profile.full_name ?? 'Profesional',
    avatar_url: profile.avatar_url ?? null,
    job_title: empRow?.job_title ?? null,
    professional_summary: empProfile?.professional_summary ?? null,
    years_of_experience: empProfile?.years_of_experience ?? null,
    specializations: (empProfile?.specializations as string[] | null) ?? [],
    business,
    services,
    reviews,
    average_rating,
    total_reviews: reviews.length,
  };
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PublicEmployeeProfile() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: employee, isLoading, error } = useQuery({
    queryKey: ['public-employee-profile', employeeId],
    queryFn: () => fetchPublicEmployee(employeeId!),
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000,
  });

  usePageMeta({
    title: employee ? `${employee.full_name} — Gestabiz` : 'Perfil profesional — Gestabiz',
    description: employee
      ? employee.professional_summary ?? `Reserva una cita con ${employee.full_name} en Gestabiz`
      : 'Perfil profesional en Gestabiz',
  });

  const handleBook = () => {
    if (!employee?.business) return;
    const params = new URLSearchParams({ book: 'true', employeeId: employee.id });
    const dest = `/negocio/${employee.business.slug}?${params.toString()}`;
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent('/app')}&businessId=${employee.business.id}&employeeId=${employee.id}`);
      return;
    }
    navigate(dest);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success('Enlace copiado al portapapeles');
    }).catch(() => {
      toast.error('No se pudo copiar el enlace');
    });
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No se encontró este perfil profesional.</p>
        <Button variant="outline" onClick={() => navigate('/')}>Ir al inicio</Button>
      </div>
    );
  }

  const initials = employee.full_name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 px-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleCopyLink} title="Copiar enlace" className="px-2">
            <Copy className="h-4 w-4" />
          </Button>
          {employee.business?.slug && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`/negocio/${employee.business!.slug}`, '_blank')}
              title="Ver negocio"
              className="px-2"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* ── Header: avatar + nombre + negocio ── */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <Avatar className="w-24 h-24 text-2xl shrink-0">
            <AvatarImage src={employee.avatar_url ?? undefined} alt={employee.full_name} />
            <AvatarFallback className="text-2xl font-bold">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <h1 className="text-2xl font-bold text-foreground">{employee.full_name}</h1>

            {employee.job_title && (
              <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                <Briefcase className="h-4 w-4 shrink-0" />
                {employee.job_title}
              </p>
            )}

            {employee.business && (
              <button
                onClick={() => navigate(`/negocio/${employee.business!.slug}`)}
                className="flex items-center justify-center sm:justify-start gap-1.5 text-primary hover:underline text-sm"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {employee.business.name}
              </button>
            )}

            {employee.average_rating !== null && (
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${s <= Math.round(employee.average_rating!) ? 'text-yellow-400 fill-yellow-400' : 'text-muted'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {employee.average_rating.toFixed(1)} ({employee.total_reviews} {employee.total_reviews === 1 ? 'reseña' : 'reseñas'})
                </span>
              </div>
            )}

            {employee.years_of_experience && (
              <p className="text-sm text-muted-foreground">
                {employee.years_of_experience} {employee.years_of_experience === 1 ? 'año' : 'años'} de experiencia
              </p>
            )}
          </div>

          {/* Botón reservar — desktop */}
          {employee.business && (
            <Button onClick={handleBook} className="hidden sm:flex gap-2 shrink-0">
              <Calendar className="h-4 w-4" />
              Reservar cita
            </Button>
          )}
        </div>

        {/* Botón reservar — mobile */}
        {employee.business && (
          <Button onClick={handleBook} className="w-full sm:hidden gap-2">
            <Calendar className="h-4 w-4" />
            Reservar cita con {employee.full_name.split(' ')[0]}
          </Button>
        )}

        {/* ── Resumen profesional ── */}
        {employee.professional_summary && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Acerca de</h2>
            <p className="text-foreground leading-relaxed">{employee.professional_summary}</p>
          </section>
        )}

        {/* ── Especializaciones ── */}
        {employee.specializations.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Especializaciones</h2>
            <div className="flex flex-wrap gap-2">
              {employee.specializations.map((spec) => (
                <Badge key={spec} variant="secondary">{spec}</Badge>
              ))}
            </div>
          </section>
        )}

        {/* ── Servicios ── */}
        {employee.services.length > 0 && (
          <>
            <Separator />
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Servicios</h2>
              <div className="space-y-2">
                {employee.services.map((svc) => (
                  <div
                    key={svc.service_id}
                    className="flex items-center justify-between py-3 px-4 rounded-lg bg-card border border-border"
                  >
                    <div>
                      <p className="font-medium text-foreground">{svc.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{svc.duration} min</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-foreground">
                        ${svc.price.toLocaleString('es-CO')}
                      </span>
                      {employee.business && (
                        <Button size="sm" variant="outline" onClick={handleBook}>
                          Reservar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── Reseñas ── */}
        {employee.reviews.length > 0 && (
          <>
            <Separator />
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Reseñas ({employee.total_reviews})
              </h2>
              <div className="space-y-3">
                {employee.reviews.map((review) => {
                  const reviewInitials = review.client_name
                    ? review.client_name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
                    : 'C';
                  return (
                    <div key={review.id} className="p-4 rounded-lg bg-card border border-border space-y-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={review.client_avatar ?? undefined} />
                          <AvatarFallback className="text-xs">{reviewInitials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {review.client_name ?? 'Cliente'}
                          </p>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-3 w-3 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <time className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })}
                        </time>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* ── CTA final ── */}
        {employee.business && (
          <div className="pt-4 pb-8">
            <Button onClick={handleBook} size="lg" className="w-full gap-2">
              <Calendar className="h-5 w-5" />
              Reservar cita con {employee.full_name.split(' ')[0]}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
