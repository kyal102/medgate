# Upgrade Path to JARVI3

This repository is the public local MedGate edition. It is useful for trying the interface and understanding the gate pattern before moving to a hosted or private deployment.

## Public Lite

- Runs locally.
- Uses local SQLite demo data.
- Includes open-source interface and demo verification routes.
- Good for technical evaluation, demos, and integration tests.

## JARVI3 Hosted / Private

The hosted JARVI3 deployment can embed MedGate inside Packages Labs at:

```text
https://jvi3.com/medgate/
```

In JARVI3, MedGate can be run as a managed gate behind the main app domain with same-origin iframe support and proxy routing.

## Deployment Contract

JARVI3 expects the MedGate app to be available at:

```text
gates/med_gate
```

During Railway builds, JARVI3 can clone this public repo into that path, install Bun dependencies, start the Next.js app on an internal port, and proxy `/medgate/`, `/_next/`, and `/api/medgate/` traffic from the main FastAPI app.

## When To Upgrade

Upgrade when you need hosted access, private controls, commercial support, organization workflows, stronger audit boundaries, or integration with the broader JARVI3 Gate suite.
