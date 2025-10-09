
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Switch,
  Text,
  VStack,
} from '@chakra-ui/react'
import { DeleteIcon } from '@chakra-ui/icons'
import { ScheduleEntry, ScheduleOverride, WeeklySchedule } from '../../types'

interface ScheduleManagerProps {
  schedules: WeeklySchedule
  overrides: ScheduleOverride[]
  onSchedulesChange: (newSchedules: WeeklySchedule) => void
  onOverridesChange: (newOverrides: ScheduleOverride[]) => void
}

const weekDays = [
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' },
  { id: 7, name: 'Domingo' },
]

export const ScheduleManager = ({
  schedules,
  overrides,
  onSchedulesChange,
  onOverridesChange,
}: ScheduleManagerProps) => {
  // --- Handlers for Weekly Schedule ---

  const handleShiftChange = (
    dayId: number,
    shiftIndex: number,
    field: 'start_time' | 'end_time',
    value: string
  ) => {
    const newSchedules = { ...schedules }
    const daySchedules = [...(newSchedules[dayId] || [])]
    daySchedules[shiftIndex] = { ...daySchedules[shiftIndex], [field]: value }
    onSchedulesChange({ ...newSchedules, [dayId]: daySchedules })
  }

  const addShift = (dayId: number) => {
    const newSchedules = { ...schedules }
    const daySchedules = [...(newSchedules[dayId] || [])]
    daySchedules.push({ start_time: '', end_time: '' })
    onSchedulesChange({ ...newSchedules, [dayId]: daySchedules })
  }

  const removeShift = (dayId: number, shiftIndex: number) => {
    const newSchedules = { ...schedules }
    const daySchedules = [...(newSchedules[dayId] || [])]
    daySchedules.splice(shiftIndex, 1)
    onSchedulesChange({ ...newSchedules, [dayId]: daySchedules })
  }

  // --- Handlers for Overrides ---
  // For simplicity, we'll manage the new override form state locally
  const [newOverrideDate, setNewOverrideDate] = useState('')
  const [newOverrideIsWorking, setNewOverrideIsWorking] = useState(true)
  const [newOverrideStartTime, setNewOverrideStartTime] = useState('')
  const [newOverrideEndTime, setNewOverrideEndTime] = useState('')

  const handleAddOverride = () => {
    if (!newOverrideDate) return
    const newOverride: ScheduleOverride = {
      // HACK: Using timestamp for temporary unique ID for React key prop.
      // This won't be sent to the database.
      id: Date.now(), 
      override_date: newOverrideDate,
      is_working: newOverrideIsWorking,
      start_time: newOverrideIsWorking ? newOverrideStartTime : null,
      end_time: newOverrideIsWorking ? newOverrideEndTime : null,
    }
    onOverridesChange([...overrides, newOverride])
    // Reset form
    setNewOverrideDate('')
    setNewOverrideIsWorking(true)
    setNewOverrideStartTime('')
    setNewOverrideEndTime('')
  }

  const removeOverride = (overrideId: number) => {
    onOverridesChange(overrides.filter(o => o.id !== overrideId))
  }

  return (
    <VStack spacing={8} align="stretch">
      {/* Weekly Schedule Section */}
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={4}>
          Horario Semanal Fijo
        </Text>
        <VStack spacing={6} align="stretch">
          {weekDays.map(day => (
            <Box key={day.id} p={4} borderWidth={1} borderRadius="md">
              <HStack justify="space-between" mb={2}>
                <Text fontWeight="medium">{day.name}</Text>
                <Button size="sm" onClick={() => addShift(day.id)}>
                  Añadir Turno
                </Button>
              </HStack>
              <VStack spacing={2} align="stretch">
                {(schedules[day.id] || []).map((shift, index) => (
                  <HStack key={index}>
                    <Input
                      type="time"
                      value={shift.start_time}
                      onChange={e =>
                        handleShiftChange(day.id, index, 'start_time', e.target.value)
                      }
                    />
                    <Text>-</Text>
                    <Input
                      type="time"
                      value={shift.end_time}
                      onChange={e =>
                        handleShiftChange(day.id, index, 'end_time', e.target.value)
                      }
                    />
                    <IconButton
                      aria-label="Eliminar turno"
                      icon={<DeleteIcon />}
                      size="sm"
                      onClick={() => removeShift(day.id, index)}
                    />
                  </HStack>
                ))}
                {(schedules[day.id] || []).length === 0 && (
                  <Text fontSize="sm" color="gray.500">
                    Día no laborable
                  </Text>
                )}
              </VStack>
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Overrides Section */}
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={4}>
          Excepciones y Días Especiales
        </Text>
        {/* Form to add new override */}
        <VStack p={4} borderWidth={1} borderRadius="md" spacing={4} mb={4}>
            <FormControl>
                <FormLabel>Fecha</FormLabel>
                <Input type="date" value={newOverrideDate} onChange={e => setNewOverrideDate(e.target.value)} />
            </FormControl>
            <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="is-working-switch" mb="0">
                    ¿Es día laborable?
                </FormLabel>
                <Switch id="is-working-switch" isChecked={newOverrideIsWorking} onChange={e => setNewOverrideIsWorking(e.target.checked)} />
            </FormControl>
            {newOverrideIsWorking && (
                <HStack>
                    <FormControl>
                        <FormLabel>Inicio</FormLabel>
                        <Input type="time" value={newOverrideStartTime} onChange={e => setNewOverrideStartTime(e.target.value)} />
                    </FormControl>
                    <FormControl>
                        <FormLabel>Fin</FormLabel>
                        <Input type="time" value={newOverrideEndTime} onChange={e => setNewOverrideEndTime(e.target.value)} />
                    </FormControl>
                </HStack>
            )}
            <Button onClick={handleAddOverride} alignSelf="flex-end">Añadir Excepción</Button>
        </VStack>
        
        {/* List of existing overrides */}
        <VStack spacing={2} align="stretch">
          {overrides.map(override => (
            <HStack key={override.id} p={2} borderWidth={1} borderRadius="md" justify="space-between">
              <Text>{new Date(override.override_date).toLocaleDateString()}</Text>
              <Text color={override.is_working ? 'green.500' : 'red.500'}>
                {override.is_working ? `Trabaja: ${override.start_time} - ${override.end_time}` : 'Día Libre'}
              </Text>
              <IconButton
                aria-label="Eliminar excepción"
                icon={<DeleteIcon />}
                size="sm"
                onClick={() => removeOverride(override.id)}
              />
            </HStack>
          ))}
        </VStack>
      </Box>
    </VStack>
  )
}
