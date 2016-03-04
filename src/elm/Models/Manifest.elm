module Models.Manifest (..) where

import Dict exposing (Dict)

type alias Manifest = Dict String String

update: Maybe Manifest -> Manifest
update manifest =
    Maybe.withDefault Dict.empty manifest
