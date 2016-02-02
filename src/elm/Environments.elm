module Environments where

type alias Environments =
  { environments: List Environment }

type alias Environment =
  { name: String
  , isDefault: Bool
  }
