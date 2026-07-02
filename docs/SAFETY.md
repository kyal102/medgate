# Safety and Clinical-Use Boundary

MedGate Lite is a software demonstration for claim-gated medical safety workflows. It is not validated, cleared, approved, certified, or intended for clinical use.

## Do Not Use For

- Patient diagnosis, treatment, monitoring, triage, prescribing, dispensing, or administration.
- Emergency, inpatient, outpatient, pharmacy, laboratory, radiology, or ambulance operations.
- Replacing clinicians, pharmacists, nurses, safety officers, or institutional policy.
- Any production workflow where an incorrect output could affect a person.

## Intended Use

- Local evaluation of the MedGate interface.
- Developer testing of route, iframe, and proxy integration.
- Product demos of explicit verification gates.
- Education around why AI-generated medical claims need boundaries.

## Data

Do not enter real patient information, protected health information, credentials, or secrets. The lite app uses local SQLite demo storage and has not been hardened for regulated health data.

## Interpretation

Treat every output as a demonstration artifact. A pass, block, warning, risk label, benchmark result, or evidence pack in this repo does not prove clinical correctness.

For real clinical environments, use validated systems, local governance, regulatory review, audit controls, professional review, and production-grade security.
