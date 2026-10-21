# PixelQuest --- Task Tracker

Status values: **pending**, **in progress**, **blocked**, **completed**.
Only mark a task completed after verification.

## Phase 1 --- Setup

  ---------------------------------------------------------------------------------
  ID             Task                Status         Dependency     Verification
  -------------- ------------------- -------------- -------------- ----------------
  P1-01          Confirm editor,     completed        None           Maintainer
                 repository, and                                   confirms
                 package manager                                   

  P1-02          Initialize Vite     completed        P1-01          Dev server
                 project if needed                                 starts

  P1-03          Install/configure   completed        P1-02          Canvas renders
                 Phaser 3                                          

  P1-04          Add responsive game completed        P1-03          Desktop/mobile
                 shell and scripts                                 viewport check
  ---------------------------------------------------------------------------------

## Phase 2 --- Asset audit and architecture

> The initial P2 checklist below is retained for traceability. The
> authoritative continuation statuses immediately before Phase 3 reflect
> the current verified state.

  -----------------------------------------------------------------------------
  ID             Task              Status         Dependency     Verification
  -------------- ----------------- -------------- -------------- --------------
  P2-01          Audit building    pending        P1-02          Image
                 spritesheet                                     inspection
                 dimensions and                                  
                 alpha                                           

  P2-02          Audit player      pending        P1-02          Frames align
                 sheet and                                       
                 determine frame                                 
                 grid                                            

  P2-03          Audit touchscreen pending        P1-02          Individual
                 UI sheet and crop                               sprites tested
                 controls                                        

  P2-04          Organize assets   pending        P2-01--03      Asset manifest
                 into documented                                 exists
                 folders                                         

  P2-05          Define Tiled      pending        P1-02          Map schema
                 layer and                                       documented
                 object-property                                 
                 conventions                                     

  P2-06          Create portfolio  pending        P1-02          Data loads
                 data files with                                 successfully
                 placeholders                                    
  -----------------------------------------------------------------------------

### Phase 2 continuation status — authoritative

| ID | Task | Status | Evidence / remaining work |
|---|---|---|---|
| P2-01 | Audit building sheet | in progress | Four sprites and dimensions reviewed; workshop slate roof still needs a manual mask. |
| P2-02 | Audit player frames | in progress | 16 measured crops and 4x4 atlas verified; facing and animation semantics remain unverified. |
| P2-03 | Audit/crop controls | in progress | 31 crops and contact sheets generated; residue/state review remains, and no left-pressed source sprite exists. |
| P2-04 | Publish asset manifest | completed | 56 processed records; four essential preload keys preserved; TypeScript typecheck passed. |
| P2-05 | Define Tiled conventions | pending | Not completed as part of this continuation. |
| P2-06 | Create portfolio data placeholders | pending | Not completed as part of this continuation. |
| P2-07 | Resolve terrain extraction | in progress | Grass divider/top strip fixed and reviewed at 8x; 55 gray/ambiguous boxes remain manual-mask-only. |
| P2-08 | Add asset validation and hash checks | completed | Every structural validation group passes; all 13 original hashes match. Overall status remains NEEDS_MANUAL_REVIEW. |
| P2-09 | Generate and inspect contact sheets | in progress | Player/building/terrain/controls sheets generated on two backgrounds; documented visual follow-ups remain. |
| P2-10 | Finish audit docs and build verification | completed | Audit report/tracking updated; npm typecheck and production build passed. |

**Phase 2 remains IN PROGRESS. Phase 3 work was explicitly requested while
review remains open; only reviewed assets are used. The controller TypeScript
and production build pass; runtime gameplay checks remain open.**

## Phase 3 --- World and player

**Status: IN PROGRESS — runtime visual verification pending.**

  ----------------------------------------------------------------------------
  ID             Task             Status         Dependency     Verification
  -------------- ---------------- -------------- -------------- --------------
  P3-01          Create data-     in progress    P2-05          Map data and
                 driven village                                references resolve

  P3-02          Integrate        in progress    P2-02          Selected atlas
                 player animation                               animation in runtime

  P3-03          Implement        in progress    P3-02          Keyboard input
                 keyboard                                       runtime check
                 movement                                       

  P3-04          Add collision    in progress    P3-01          Runtime check
                 collisions                                     objects cannot
                                                                be crossed

  P3-05          Implement camera in progress    P3-01          Runtime camera
                 follow and                                     map void
                 bounds                                         
  P3-06          Add responsive   in progress    P3-03          Touch D-pad via
                 touch D-pad                                    `?touchControls`
  P3-07          Add player/body  in progress    P3-04          `?debug` body,
                 debug view                                     foot and state
  ----------------------------------------------------------------------------

## Phase 4 --- Interactions and portfolio

> The controller request supplied for this continuation is titled Phase 4,
> but this tracker follows the repository roadmap: player control is P3 work.

  --------------------------------------------------------------------------------------------
  ID             Task                    Status         Dependency     Verification
  -------------- ----------------------- -------------- -------------- -----------------------
  P4-01          Create shared input     pending        P3-03          Inputs produce
                 interface                                             consistent actions

  P4-02          Add interactable object pending        P3-01          IDs resolve correctly
                 registry                                              

  P4-03          Add NPC dialogue        pending        P4-02          Dialogue
                                                                       opens/advances/closes

  P4-04          Add building            pending        P4-02          Correct panel opens
                 interactions                                          

  P4-05          Add About, Projects,    pending        P2-06          Data renders correctly
                 Skills, Contact panels                                

  P4-06          Add non-game portfolio  pending        P4-05          Sections reachable
                 navigation                                            without exploration

  P4-07          Add                     pending        P3-04          Destination behavior
                 click/tap-to-navigate                                 verified
                 or documented fallback                                
  --------------------------------------------------------------------------------------------

## Phase 5 --- Mobile

  --------------------------------------------------------------------------
  ID             Task           Status         Dependency     Verification
  -------------- -------------- -------------- -------------- --------------
  P5-01          Add D-pad or   pending        P4-01          Touch movement
                 virtual                                      works
                 joystick                                     

  P5-02          Add action and pending        P4-01          Touch
                 pause buttons                                interactions
                                                              work

  P5-03          Support        pending        P5-01--02      No stuck
                 multi-touch                                  movement
                 and cancel                                   
                 events                                       

  P5-04          Fit UI to      pending        P5-01--02      Orientation
                 portrait and                                 tests pass
                 landscape                                    

  P5-05          Prevent        pending        P5-01          Scroll
                 accidental                                   behavior
                 page scrolling                               verified
                 during play                                  
  --------------------------------------------------------------------------

## Phase 6 --- Testing

  -----------------------------------------------------------------------------
  ID             Task           Status         Dependency     Verification
  -------------- -------------- -------------- -------------- -----------------
  P6-01          Test full      pending        P4-06          Checklist passes
                 desktop user                                 
                 journey                                      

  P6-02          Test Android   pending        P5-04          Device/emulator
                 user journey                                 test

  P6-03          Test missing   pending        P4-05          Graceful fallback
                 assets and                                   
                 content                                      

  P6-04          Check console  pending        P6-01--02      No blocking
                 and network                                  errors
                 errors                                       

  P6-05          Add automated  pending        P6-01          Tests pass
                 tests where                                  
                 practical                                    
  -----------------------------------------------------------------------------

## Phase 7 --- Polish

  ---------------------------------------------------------------------------
  ID             Task           Status         Dependency     Verification
  -------------- -------------- -------------- -------------- ---------------
  P7-01          Verify pixel   pending        P2-01--03      Visual check
                 sharpness and                                
                 transparency                                 

  P7-02          Tune touch     pending        P5-04          Mobile
                 targets and                                  usability check
                 dialogue                                     
                 readability                                  

  P7-03          Add focus,     pending        P4-05          State review
                 disabled,                                    
                 loading, and                                 
                 error states                                 

  P7-04          Optimize asset pending        P6-04          Build size
                 sizes                                        reviewed

  P7-05          Review         pending        P7-03          Accessibility
                 keyboard                                     checklist
                 access and                                   
                 reduced motion                               
  ---------------------------------------------------------------------------

## Phase 8 --- Deployment

  --------------------------------------------------------------------------
  ID             Task           Status         Dependency     Verification
  -------------- -------------- -------------- -------------- --------------
  P8-01          Configure      pending        P7-04          Build succeeds
                 production                                   
                 base path and                                
                 build                                        

  P8-02          Preview        pending        P8-01          Main journey
                 production                                   passes
                 output                                       

  P8-03          Deploy to      pending        P8-02          HTTPS URL
                 chosen static                                works
                 host                                         

  P8-04          Test deployed  pending        P8-03          Both pass
                 desktop and                                  
                 Android                                      
                 versions                                     

  P8-05          Update memory, pending        P8-04          Docs reflect
                 README, and                                  reality
                 deployment                                   
                 notes                                        
  --------------------------------------------------------------------------

## Phase 1 completion notes (2026-10-21)

All four Phase 1 tasks verified. Evidence:

-   P1-01: No prior repository existed; project created at `pixelquest/`
    with npm. Editor/IDE still unconfirmed (not needed for Phase 1).
-   P1-02: `npm run dev` starts (Vite 7.3); `npm run build` exits 0
    (`tsc --noEmit` + `vite build`); `npm run preview` serves `dist/`.
-   P1-03: Phaser 3.90.0 canvas renders; 75/75 automated browser checks
    pass on both dev server and production preview (Playwright/Chromium).
-   P1-04: Integer-zoom responsive scaler verified at 1366x768, 1920x1080,
    1024x768, 360x800 and 390x844 (dpr 3), 844x390 (dpr 2.75), plus live
    resize/rotation. No horizontal overflow; no console errors.

Phase 1 deviations/decisions: TypeScript used (per the Phase 1 prompt)
although `architecture.md` shows `.js`; `git init` done but nothing
committed; real-device Android and Windows Edge/Chrome not tested
(emulated Chromium only).

## Current next actionable task

**Continue Phase 2 manual asset review:** create masks for the 55 flagged
terrain tiles and slate-roof workshop; resolve player directions/
animation order and mobile-control residue/state alignment. Re-run
`npm run assets:validate`, `npm run typecheck`, and `npm run build` after
those changes. Do not begin Phase 3 until the pipeline is stable.
