/**
 * Alegra API Client — Facturación Electrónica Colombia
 *
 * Genera facturas electrónicas válidas ante la DIAN cuando un pago de
 * suscripción es aprobado en MercadoPago.
 *
 * API Docs: https://developer.alegra.com/
 *
 * Autenticación: Basic Auth → base64(user:apiKey)
 * Variable requerida (Supabase Secret): ALEGRA_TOKEN
 *   Formato: base64("<tu-email-alegra>:<tu-api-key-alegra>")
 *   Ejemplo: btoa("admin@empresa.com:abc123def456")
 *
 * Endpoints usados:
 *   GET  /contacts?identifications=<NIT>  → buscar contacto por NIT
 *   POST /contacts                        → crear contacto
 *   GET  /items?name=<nombre>             → buscar ítem del plan
 *   POST /items                           → crear ítem
 *   POST /invoices                        → crear factura electrónica
 */

const ALEGRA_BASE_URL = 'https://api.alegra.com/api/v1'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AlegraContact {
  id: number
  name: string
  identification?: string
  email?: string
}

export interface AlegraItem {
  id: number
  name: string
  price: number
}

export interface AlegraInvoice {
  id: number
  number: string | number
  date: string
  status: string
  total: number
  client?: { id: number; name: string }
  stamp?: { date?: string; number?: string; uuid?: string; status?: string }
}

export interface AlegraUpsertContactParams {
  name: string
  identification?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  /** 'common' = Régimen Común | 'simplified' = Régimen Simplificado */
  regime?: 'common' | 'simplified' | null
}

export interface AlegraCreateInvoiceParams {
  contactId: number
  itemId: number
  /** Precio real cobrado en esta factura (puede diferir del precio base del ítem) */
  unitPrice: number
  description: string
  /** Fecha de la factura en formato YYYY-MM-DD */
  date: string
  sendEmail?: boolean
  emailTo?: string
  notes?: string
}

// ─── Client ─────────────────────────────────────────────────────────────────

export class AlegraClient {
  private readonly authHeader: string

  constructor(token: string) {
    this.authHeader = `Basic ${token}`
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${ALEGRA_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    })

    if (!response.ok) {
      const body = await response.text().catch(() => response.statusText)
      throw new Error(`Alegra API ${response.status} on ${path}: ${body}`)
    }

    return response.json() as Promise<T>
  }

  /**
   * Busca un contacto (cliente) por NIT/cédula en Alegra.
   * Si no existe, lo crea.
   * Retorna el ID interno del contacto en Alegra.
   */
  async upsertContact(params: AlegraUpsertContactParams): Promise<number> {
    // Buscar por identificación fiscal primero
    if (params.identification) {
      try {
        const contacts = await this.request<AlegraContact[]>(
          `/contacts?identifications=${encodeURIComponent(params.identification)}&fields=id,name,identification`,
        )
        if (Array.isArray(contacts) && contacts.length > 0) {
          return contacts[0].id
        }
      } catch (err) {
        // No encontrado o error de red — continuamos creando
      }
    }

    const body: Record<string, unknown> = {
      name: params.name,
      identification: params.identification ?? '',
      email: params.email ?? '',
      type: ['client'],
    }

    if (params.city != null) {
      body['address'] = { address: params.address ?? '', city: params.city }
    }

    if (params.regime != null) {
      body['regime'] = params.regime
    }

    const contact = await this.request<AlegraContact>('/contacts', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    return contact.id
  }

  /**
   * Busca el ítem del plan en el catálogo de Alegra por nombre exacto.
   * Si no existe, lo crea con el precio base del plan.
   * Retorna el ID interno del ítem en Alegra.
   */
  async getOrCreateItem(itemName: string, basePrice: number): Promise<number> {
    try {
      const items = await this.request<AlegraItem[]>(
        `/items?name=${encodeURIComponent(itemName)}&fields=id,name,price`,
      )
      if (Array.isArray(items) && items.length > 0) {
        return items[0].id
      }
    } catch (err) {
    }

    const item = await this.request<AlegraItem>('/items', {
      method: 'POST',
      body: JSON.stringify({
        name: itemName,
        description: 'Suscripción al servicio de gestión de citas y negocios Gestabiz',
        price: basePrice,
        unit: 'service',
        inventory: { unit: 'service' },
      }),
    })

    return item.id
  }

  /**
   * Crea una factura electrónica en Alegra.
   * La factura se emite con sello DIAN si `stamp.generateStamp = true`.
   */
  async createInvoice(params: AlegraCreateInvoiceParams): Promise<AlegraInvoice> {
    const body: Record<string, unknown> = {
      date: params.date,
      client: { id: params.contactId },
      items: [
        {
          id: params.itemId,
          description: params.description,
          price: params.unitPrice,
          quantity: 1,
        },
      ],
      // Método de pago electrónico (código Alegra para pagos digitales)
      paymentMethod: 'electronic',
      // Timbrado electrónico ante DIAN
      stamp: { generateStamp: true },
    }

    if (params.notes) {
      body['observations'] = params.notes
    }

    if (params.sendEmail && params.emailTo) {
      body['send'] = [{ to: [params.emailTo] }]
    }

    const invoice = await this.request<AlegraInvoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    return invoice
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Inicializa el cliente de Alegra leyendo ALEGRA_TOKEN del entorno.
 *
 * Si el token no está configurado retorna null — la facturación en Alegra
 * es opcional y no bloquea el flujo principal de pagos.
 */
export function getAlegraClient(): AlegraClient | null {
  const token = Deno.env.get('ALEGRA_TOKEN')
  if (!token) {
    return null
  }
  return new AlegraClient(token)
}

/**
 * Construye el nombre del ítem del plan para el catálogo de Alegra.
 * Ejemplo: "Plan Básico Gestabiz (Mensual)"
 */
export function buildPlanLabel(planType: string, billingCycle: string): string {
  const planNames: Record<string, string> = {
    free: 'Plan Gratis Gestabiz',
    basico: 'Plan Básico Gestabiz',
    pro: 'Plan Pro Gestabiz',
  }
  const cycleLabel = billingCycle === 'yearly' ? 'Anual' : 'Mensual'
  const planName = planNames[planType] ?? `Plan ${planType} Gestabiz`
  return `${planName} (${cycleLabel})`
}
