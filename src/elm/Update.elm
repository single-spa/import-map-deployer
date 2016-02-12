module Update where

import Effects exposing (Effects)
import Actions exposing (Action)
import Dict

import Model exposing (Model)
import Environments
import Manifest

init : (Model, Effects Action)
init =
  ( { environments = []
    , selectedEnviro = {name  = "", isDefault = False}
    , manifest = Dict.empty
    }
  , Environments.getEnvironments
  )

update : Action -> Model -> (Model, Effects Action)
update action model =
  case action of
    Actions.GetEnvironments ->
      ( model
      , Environments.getEnvironments
      )
    Actions.GotEnvironments environments ->
      ( {model | environments = ( Maybe.withDefault [] environments )}
      , Effects.none
      )
    Actions.GetManifest ->
      ( model
      , Manifest.getManifest
      )
    Actions.GotManifest manifest ->
      ( {model | manifest = (Manifest.update manifest)}
      , Effects.none
      )
