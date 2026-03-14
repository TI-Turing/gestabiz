import { useState } from 'react'
import { useKV } from '@/lib/useKV'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientCard } from '@/components/cards/ClientCard'
import { Badge } from '@/components/ui/badge'
import { Plus, User, Building, PencilSimple, Trash, ArrowLeft } from '@phosphor-icons/react'
import { User as UserType, Client, Appointment } from '@/types'
import { toast } from 'sonner'

interface ClientsViewProps {
  user: UserType
}

export default function ClientsView({ user }: ClientsViewProps) {
  const [clients, setClients] = useKV<Client[]>(`clients-${user.business_id || user.id}`, [])
  const [appointments] = useKV<Appointment[]>(`appointments-${user.business_id || user.id}`, [])
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getClientAppointmentCount = (clientId: string) => {
    return appointments.filter(apt => apt.client_id === clientId).length
  }

  const getClientUpcomingAppointments = (clientId: string) => {
    const today = new Date().toISOString().split('T')[0]
    return appointments.filter(apt => {
      const aptDate = apt.start_time.split('T')[0]
      return apt.client_id === clientId && aptDate >= today && apt.status === 'scheduled'
    }).length
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Name is required')
      return
    }

    if (email && !email.includes('@')) {
      toast.error('Please enter a valid email')
      return
    }

    if (editingClient) {
      setClients(current =>
        current.map(client =>
          client.id === editingClient.id
            ? {
                ...client,
                name: name.trim(),
                email: email.trim() || undefined,
                phone: phone.trim() || undefined,
                company: company.trim() || undefined
              }
            : client
        )
      )
      toast.success('Client updated successfully')
    } else {
      const newClient: Client = {
        id: crypto.randomUUID(),
        business_id: user.business_id || user.id,
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        company: company.trim() || undefined,
        language: 'es',
        total_appointments: 0,
        is_recurring: false,
        status: 'active',
        tags: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user.id
      }
      setClients(current => [...current, newClient])
      toast.success('Client added successfully')
    }

    resetForm()
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setName(client.name)
    setEmail(client.email || '')
    setPhone(client.phone || '')
    setCompany(client.company || '')
    setShowForm(true)
  }

  const handleDelete = (clientId: string) => {
    const clientAppointments = appointments.filter(apt => apt.clientId === clientId)
    
    if (clientAppointments.length > 0) {
      toast.error('Cannot delete client with existing appointments')
      return
    }

    if (confirm('Are you sure you want to delete this client?')) {
      setClients(current => current.filter(client => client.id !== clientId))
      toast.success('Client deleted successfully')
    }
  }

  const resetForm = () => {
    setName('')
    setEmail('')
    setPhone('')
    setCompany('')
    setEditingClient(null)
    setShowForm(false)
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={resetForm}>
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold">
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h2>
            <p className="text-muted-foreground">
              {editingClient ? 'Update client information' : 'Add a new client to your contact list'}
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Client full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingClient ? 'Update Client' : 'Add Client'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Clients</h2>
          <p className="text-muted-foreground">
            Manage your client contact information
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={16} className="mr-2" />
          Add Client
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Clients List */}
      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <User size={64} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {clients.length === 0 ? 'No clients yet' : 'No clients found'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {clients.length === 0 
                ? "Add your first client to start scheduling appointments." 
                : "Try adjusting your search terms."
              }
            </p>
            {clients.length === 0 && (
              <Button onClick={() => setShowForm(true)}>
                <Plus size={16} className="mr-2" />
                Add Your First Client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredClients.map((client) => {
            const appointmentCount = getClientAppointmentCount(client.id)
            const upcomingCount = getClientUpcomingAppointments(client.id)

            return (
              <ClientCard
                key={client.id}
                clientId={client.id}
                initialData={{
                  id: client.id,
                  name: client.name,
                  email: client.email,
                  phone: client.phone,
                  avatar_url: undefined,
                }}
                readOnly
                renderActions={() => (
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(client)}>
                      <PencilSimple size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(client.id)} className="text-destructive hover:text-destructive">
                      <Trash size={16} />
                    </Button>
                  </div>
                )}
              >
                {upcomingCount > 0 && (
                  <Badge variant="secondary">{upcomingCount} upcoming</Badge>
                )}
                {client.company && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Building size={14} className="mr-2" />
                    {client.company}
                  </div>
                )}
                <div className="mt-1">
                  <span className="text-sm text-muted-foreground">
                    {appointmentCount} total appointment{appointmentCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </ClientCard>
            )
          })}
        </div>
      )}
    </div>
  )
}