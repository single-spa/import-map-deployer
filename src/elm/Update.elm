module Update where
import Debug

import Effects exposing (Effects)
import Actions exposing (Action)
import Dict
import Maybe exposing (Maybe)

import Routing.Routes

import Model exposing (Model)
import Routes.Environments
import Routes.Manifest

import Resources.Environments
import Resources.Manifest
import Models.Manifest

init : String -> (Model, Effects Action)
init initialPath =
  let
    activeRoute = Routing.Routes.matchRoute initialPath
  in
  ( { environments = []
    , selectedEnviro = {name  = "", isDefault = False}
    , manifest = Dict.empty
    , activeRoute = activeRoute
    }
  , Effects.batch [Routing.Routes.getRouteEffects activeRoute, Resources.Environments.getEnvironments]
  )

update : Action -> Model -> (Model, Effects Action)
update action model =
  case action of
    Actions.RouteChanged routePath ->
      let
        activeRoute = Routing.Routes.matchRoute routePath
      in
      ( {model | activeRoute = activeRoute}
      , Routing.Routes.getRouteEffects activeRoute
      )
    Actions.GotEnvironments environments ->
      ( {model | environments = ( Maybe.withDefault [] environments )}
      , Effects.none
      )
    Actions.GotManifest manifest ->
      ( {model | manifest = (Models.Manifest.update manifest)}
      , Effects.none
      )
    Actions.ServiceChange key value ->
      ( {model | manifest = Dict.update key (\v-> Just value) model.manifest}
      , Effects.none
      )
    Actions.SaveManifest service env ->
      ( model
      , Resources.Manifest.patchManifest service env
      )
    Actions.NoOp ->
      ( model, Effects.none )
