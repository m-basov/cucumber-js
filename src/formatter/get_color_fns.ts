import { Writable } from 'node:stream'
import { styleText } from 'node:util'
import { ColorInfo, supportsColor } from 'supports-color'
import { TestStepResultStatus } from '@cucumber/messages'
import { doesNotHaveValue } from '../value_checker'

export type IColorFn = (text: string) => string

export interface IColorFns {
  forStatus: (status: TestStepResultStatus) => IColorFn
  location: IColorFn
  tag: IColorFn
  diffAdded: IColorFn
  diffRemoved: IColorFn
  errorMessage: IColorFn
  errorStack: IColorFn
}

type ITextStyle = Parameters<typeof styleText>[0]
function createColorFn(style: ITextStyle): IColorFn {
  return (text) => styleText(style, text)
}

export default function getColorFns(
  stream: Writable,
  env: NodeJS.ProcessEnv,
  enabled?: boolean
): IColorFns {
  const support: ColorInfo = detectSupport(stream, env, enabled)
  if (support) {
    return {
      forStatus(status: TestStepResultStatus) {
        return {
          AMBIGUOUS: createColorFn('red'),
          FAILED: createColorFn('red'),
          PASSED: createColorFn('green'),
          PENDING: createColorFn('yellow'),
          SKIPPED: createColorFn('cyan'),
          UNDEFINED: createColorFn('yellow'),
          UNKNOWN: createColorFn('yellow'),
        }[status]
      },
      location: createColorFn('gray'),
      tag: createColorFn('cyan'),
      diffAdded: createColorFn('green'),
      diffRemoved: createColorFn('red'),
      errorMessage: createColorFn('red'),
      errorStack: createColorFn('grey'),
    }
  } else {
    return {
      forStatus(_status: TestStepResultStatus) {
        return (x) => x
      },
      location: (x) => x,
      tag: (x) => x,
      diffAdded: (x) => x,
      diffRemoved: (x) => x,
      errorMessage: (x) => x,
      errorStack: (x) => x,
    }
  }
}

function detectSupport(
  stream: Writable,
  env: NodeJS.ProcessEnv,
  enabled?: boolean
): ColorInfo {
  const support: ColorInfo = supportsColor(stream)
  // if we find FORCE_COLOR, we can let the supports-color library handle that
  if ('FORCE_COLOR' in env || doesNotHaveValue(enabled)) {
    return support
  }
  return enabled ? support || { level: 1 } : false
}
