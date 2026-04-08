import * as Slider from '@radix-ui/react-slider'

type HeartRateRangeSliderProps = {
  min: number
  max: number
  value: [number, number]
  onChange: (nextValue: [number, number]) => void
  onCommit: (nextValue: [number, number]) => void
}

export default function HeartRateRangeSlider({
  min,
  max,
  value,
  onChange,
  onCommit,
}: HeartRateRangeSliderProps) {
  const [minValue, maxValue] = value

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-900">Heart rate range</span>
        <span className="text-sm text-zinc-600">
          {minValue} - {maxValue} bpm
        </span>
      </div>

      <Slider.Root
        min={min}
        max={max}
        step={1}
        value={value}
        onValueChange={(nextValue) => onChange(nextValue as [number, number])}
        onValueCommit={(nextValue) => onCommit(nextValue as [number, number])}
        className="relative flex h-6 w-full touch-none items-center"
      >
        <Slider.Track className="relative h-2 grow rounded-full bg-stone-200">
          <Slider.Range className="absolute h-full rounded-full bg-orange-500" />
        </Slider.Track>

        <Slider.Thumb className="block h-5 w-5 rounded-full border border-orange-500 bg-white shadow outline-none focus:ring-2 focus:ring-orange-300" />
        <Slider.Thumb className="block h-5 w-5 rounded-full border border-orange-500 bg-white shadow outline-none focus:ring-2 focus:ring-orange-300" />
      </Slider.Root>

      <div className="flex justify-between text-xs text-zinc-500">
        <span>{min} bpm</span>
        <span>{max} bpm</span>
      </div>
    </div>
  )
}
