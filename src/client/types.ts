import type { TRPCClientErrorLike, TRPCRequestOptions as _TRPCRequestOptions } from '@trpc/client'
import { type TRPCSubscriptionObserver } from '@trpc/client/dist/internals/TRPCUntypedClient'
import type {
  AnyMutationProcedure,
  AnyProcedure,
  AnyQueryProcedure,
  AnyRouter,
  ProcedureRouterRecord,
  inferProcedureInput,
  inferProcedureOutput,
  ProcedureArgs,
  AnySubscriptionProcedure
} from '@trpc/server'
import { type inferObservableValue, type Unsubscribable } from '@trpc/server/observable'
import { inferTransformedProcedureOutput } from '@trpc/server/shared'
import type {
  AsyncData,
  AsyncDataOptions,
  KeysOf,
  PickFrom,
} from 'nuxt/dist/app/composables/asyncData'

interface TRPCRequestOptions extends _TRPCRequestOptions {
  abortOnUnmount?: boolean
}

type Resolver<TProcedure extends AnyProcedure> = (
  ...args: ProcedureArgs<TProcedure['_def']>
) => Promise<inferTransformedProcedureOutput<TProcedure>>;

type SubscriptionResolver<
  TProcedure extends AnyProcedure,
  TRouter extends AnyRouter,
> = (
  ...args: [
    input: ProcedureArgs<TProcedure['_def']>[0],
    opts: ProcedureArgs<TProcedure['_def']>[1] &
    Partial<
        TRPCSubscriptionObserver<
          inferObservableValue<inferProcedureOutput<TProcedure>>,
          TRPCClientErrorLike<TRouter>
        >
      >,
  ]
) => Unsubscribable

type DecorateProcedure<
  TProcedure extends AnyProcedure,
  TRouter extends AnyRouter,
> = TProcedure extends AnyQueryProcedure
  ? {
      useQuery: <
      TData = inferTransformedProcedureOutput<TProcedure>,
      PickKeys extends KeysOf<TData> = KeysOf<TData>,
     >(
        input: inferProcedureInput<TProcedure>,
        opts?: AsyncDataOptions<TData, TData, PickKeys> & { trpc?: TRPCRequestOptions },
      ) => AsyncData<PickFrom<TData, PickKeys>, TRPCClientErrorLike<TProcedure>>,
      query: Resolver<TProcedure>
    } : TProcedure extends AnyMutationProcedure ? {
      mutate: Resolver<TProcedure>
    } : TProcedure extends AnySubscriptionProcedure ? {
      subscribe: SubscriptionResolver<TProcedure, TRouter>
    } : never

/**
* @internal
*/
export type DecoratedProcedureRecord<
  TProcedures extends ProcedureRouterRecord,
  TRouter extends AnyRouter,
> = {
  [TKey in keyof TProcedures]: TProcedures[TKey] extends AnyRouter
    ? DecoratedProcedureRecord<TProcedures[TKey]['_def']['record'], TRouter>
    : TProcedures[TKey] extends AnyProcedure
      ? DecorateProcedure<TProcedures[TKey], TRouter>
      : never;
}
