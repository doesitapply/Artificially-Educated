import React from 'react';
import type { TimelineMonth, ReportSection } from './types';
import ViolationsChart from './components/ViolationsChart';

export const timelineData: TimelineMonth[] = [
  {
    month: "September 2023",
    events: [
        { id: "20230912", date: "September 12, 2023", title: "Arraignment", cause: "Defendant is arraigned on charges of Grand Larceny of a Motor Vehicle and Unlawful Taking of a Motor Vehicle.", effect: "Defendant pleads Not Guilty to all charges. The 60-day rule for a speedy trial is waived. Counsel is ordered to set dates for Jury Trial and other motions.", claim: "Sixth Amendment (Right to Counsel).", relief: "N/A - Standard procedure." }
    ]
  },
  {
    month: "January 2024",
    events: [
        { id: "20240117", date: "January 17, 2024", title: "Substitution of Counsel", cause: "Sydney Hutt substitutes in as the Deputy Alternate Public Defender for the Defendant.", effect: "Defendant has new legal representation from within the same public defender's office.", claim: "Sixth Amendment (Right to Counsel).", relief: "N/A - Standard procedure." }
    ]
  },
  {
    month: "February 2024",
    events: [
      { id: "20240212", date: "February 12, 2024", title: "Plaintiff files first motion", cause: "Plaintiff exercises First Amendment right to petition by filing a legitimate request for information and investigation.", effect: "Public defender Sydney Hutt fails to respond to legitimate requests, effectively ignoring the petition and denying access to crucial information.", claim: "First Amendment (Right to Petition), Sixth Amendment (Ineffective Assistance of Counsel), Fourteenth Amendment (Due Process).", relief: "Removal of ineffective counsel, compensatory damages." },
      { id: "20240213", date: "February 13, 2024", title: "Request for body cam footage", cause: "Plaintiff seeks exculpatory evidence vital for defense.", effect: "Public defender Sydney Hutt fails to obtain this evidence, hindering the defense and potentially concealing exculpatory material.", claim: "Sixth Amendment (Ineffective Assistance of Counsel), Fourteenth Amendment (Due Process - Brady violation implications).", relief: "Production of evidence, sanctions, compensatory damages." }
    ]
  },
  {
    month: "March 2024",
    events: [
      { id: "20240312", date: "March 12, 2024", title: "One-year anniversary of arrest", cause: "State actors allow the case to languish without resolution or proper advancement.", effect: "Systematic delay without justification, violating the right to a speedy trial and due process.", claim: "Sixth Amendment (Speedy Trial), Fourteenth Amendment (Due Process).", relief: "Dismissal with prejudice, compensatory damages." },
    ]
  },
  {
    month: "April 2024",
    events: [
      { id: "20240417", date: "April 17, 2024", title: "Pretrial Conference Vacated & Reset", cause: "An application for setting is filed which vacates the Pretrial Conference scheduled for April 16, 2024.", effect: "The Pretrial Conference is reset to April 23, 2024, altering the court schedule.", claim: "Procedural Action.", relief: "Proper notice, sanctions." },
      { id: "20240423", date: "April 23, 2024", title: "Trial Continued at Motion Hearing", cause: "At a Motion to Confirm Trial hearing, defense counsel moves to continue the trial, which was set for May 13, 2024.", effect: "The court vacates the May trial date and sets a Status Hearing for May 21, 2024, to reset dates. Defendant remains out of custody.", claim: "Sixth Amendment (Speedy Trial).", relief: "Objection to continuance, demand for speedy trial." }
    ]
  },
  {
    month: "May 2024",
    events: [
      { id: "20240508", date: "May 8, 2024", title: "Pro Se Motion to Dismiss Filed", cause: "Defendant files a pro se Motion to Dismiss, citing lack of victim, requesting new counsel, and alleging ineffective assistance.", effect: "The Defendant formally challenges the foundation of the charges and the quality of his legal representation.", claim: "Sixth Amendment (Ineffective Assistance of Counsel).", relief: "Dismissal of charges, appointment of new counsel." },
      { id: "20240509", date: "May 9, 2024", title: "Court Strikes Defendant's Motion", cause: "The Court issues an order striking the Defendant's May 8 motion.", effect: "The motion is removed from the record because the Defendant is represented by counsel and not permitted to file documents on his own behalf.", claim: "First Amendment (Right to Petition), Sixth Amendment (Right to Self-Representation).", relief: "Reversal of order, consideration of motion." },
      { id: "20240516", date: "May 16, 2024", title: "Counsel Requests Young Hearing", cause: "Defense Counsel Sydney Hutt files a Request for a Hearing pursuant to Young v. State, indicating a conflict with the Defendant.", effect: "This initiates a process to evaluate the attorney-client relationship, which the Defendant later claims was unauthorized.", claim: "Sixth Amendment (Ineffective Assistance of Counsel).", relief: "To have the unauthorized motion withdrawn." },
      { id: "20240521", date: "May 21, 2024", title: "Young Hearing Continued", cause: "At a scheduled Status Hearing, the court's time constraints from an ongoing jury trial prevent the Young hearing from proceeding.", effect: "The Young Hearing is continued to May 30, 2024.", claim: "Procedural Action.", relief: "N/A." },
      { id: "20240530", date: "May 30, 2024", title: "Conflict of Interest Declared", cause: "At the Young Hearing, a conflict of interest is established. The Washoe County Alternate Public Defender's Office is relieved as counsel.", effect: "The court refers the matter for the appointment of new conflict counsel. A status hearing is set for June 25, 2024.", claim: "Sixth Amendment (Right to Conflict-Free Counsel).", relief: "Appointment of competent, unbiased counsel." },
      { id: "20240531", date: "May 31, 2024", title: "Order Appointing Conflict Counsel", cause: "The Court files an official order referring the case to the Conflict Counsel/Attorney Administrator.", effect: "Formal process to appoint new counsel for the Defendant is initiated.", claim: "Procedural Action.", relief: "N/A." }
    ]
  },
  {
    month: "June 2024",
    events: [
      { id: "20240603", date: "June 3, 2024", title: "Galen Carrico Appointed as Counsel", cause: "Following a recommendation from the Appointed Counsel Administrator, the Court appoints Galen Carrico, Esq. to represent the Defendant.", effect: "Defendant is assigned his third legal representative.", claim: "Sixth Amendment (Right to Counsel).", relief: "Appointment of effective counsel." },
      { id: "20240624", date: "June 24, 2024", title: "Galen Carrico Files Notice of Appearance", cause: "Attorney Galen D. Carrico formally enters his appearance as counsel for the defendant.", effect: "Mr. Carrico is now the official attorney of record.", claim: "Procedural Action.", relief: "N/A." },
      { id: "20240625", date: "June 25, 2024", title: "Status Hearing with New Counsel", cause: "Defendant appears with new counsel, Galen Carrico. Defendant states he has just met Mr. Carrico.", effect: "The court notes that negotiations are ongoing and that the matter needs to be set for trial. The Defendant remains out of custody.", claim: "Sixth Amendment (Right to Counsel/Speedy Trial).", relief: "Adequate time to consult with counsel, preservation of speedy trial rights." }
    ]
  },
  {
    month: "July 2024",
    events: [
      { id: "20240710", date: "July 10, 2024", title: "Jury Trial Set for 2025", cause: "An Application for Setting is filed by the prosecution.", effect: "A Jury Trial is scheduled for March 24, 2025, with pretrial motions to be heard on February 13, 2025. This further extends the case timeline.", claim: "Sixth Amendment (Speedy Trial).", relief: "Dismissal due to delay." }
    ]
  },
  {
    month: "August 2024",
    events: [
      { id: "20240819", date: "August 19, 2024", title: "Motion to Dismiss Based on Systemic Violations", cause: "Defendant, through his counsel Galen Carrico, files a comprehensive motion to dismiss.", effect: "The motion alleges prosecutorial misconduct, judicial failures, double jeopardy, Brady violations, and ineffective assistance of counsel from previous attorneys.", claim: "Fourth, Fifth, Sixth, Eighth, and Fourteenth Amendments.", relief: "Dismissal of all charges with prejudice." }
    ]
  },
  {
    month: "September 2024",
    events: [
      { id: "20240911", date: "September 11, 2024", title: "Counsel Files Motion for Young Hearing", cause: "Counsel Galen Carrico files a motion for a Young Hearing, citing a breakdown in communication and the Defendant's perceived conflicts.", effect: "This action is allegedly taken against the Defendant's explicit instructions to file a motion to dismiss, leading to claims of ineffective assistance and subversion of the defense.", claim: "Sixth Amendment (Ineffective Assistance).", relief: "Denial of Young Hearing, order to file Motion to Dismiss." },
      { id: "20240917", date: "September 17, 2024", title: "Young Hearing Scheduled", cause: "An Application for Setting is filed, scheduling the Young Hearing requested by counsel.", effect: "The court sets the hearing for December 5, 2024.", claim: "Procedural Action.", relief: "N/A." }
    ]
  },
  {
    month: "October 2024",
    events: [
      { id: "20241015", date: "October 15, 2024", title: "Pro Se Motion for Sanctions Filed and Stricken", cause: "Defendant files a pro se motion for sanctions against various parties. The Clerk of the Court strikes the motion.", effect: "The motion is deemed a 'fugitive document' and stricken from the record for lacking a proper affirmation, preventing it from being considered by the court.", claim: "First Amendment (Right to Petition).", relief: "Reinstatement and consideration of the motion." },
      { id: "20241024", date: "October 24, 2024", title: "State Moves to Strike; Defendant Responds", cause: "The State files a motion to strike the Defendant's sanctions motion. The Defendant files a detailed response.", effect: "Defendant argues his pro se filings are necessary due to ineffective counsel and alleges malicious, coordinated actions by his counsel and the prosecution.", claim: "First Amendment (Right to Petition), Sixth Amendment (Right to Self-Representation).", relief: "Denial of the State's motion to strike; consideration of Defendant's response." },
      { id: "20241028", date: "October 28, 2024", title: "Court Strikes Defendant's Pro Se Filings", cause: "The Court grants the State's Motion to Strike.", effect: "The Defendant's Motion for Sanctions and his Response are stricken from the record because he is represented by counsel, continuing the pattern of his pro se filings being dismissed on procedural grounds.", claim: "First Amendment (Right to Petition), Fourteenth Amendment (Due Process).", relief: "Reversal of the order." },
      { id: "20241030", date: "October 30, 2024", title: "Motion for Leave to File Pro Se Motions", cause: "Defendant files a motion requesting leave from the court to file his own motions.", effect: "Argues that ineffective assistance of counsel makes it necessary for him to file pro se to preserve his constitutional rights.", claim: "Sixth Amendment (Right to Self-Representation), Fourteenth Amendment (Due Process).", relief: "Granting leave to file pro se motions." }
    ]
  },
   {
    month: "November 2024",
    events: [
        { id: "20241126", date: "November 26, 2024", title: "Defendant Files Motion to Dismiss with Prejudice", cause: "Defendant submits a comprehensive motion to dismiss, alleging systemic constitutional violations, prosecutorial misconduct, and collusion.", effect: "This pro se motion details a wide range of alleged abuses and seeks dismissal, sanctions, and compensation.", claim: "Multiple Constitutional Violations.", relief: "Dismissal with prejudice, sanctions." },
        { id: "20241129", date: "November 29, 2024", title: "Motion for Sanctions Against DA Kandaras", cause: "Plaintiff files a motion seeking sanctions against Chief Deputy District Attorney Mary Kandaras for professional misconduct and intimidation.", effect: "The motion alleges that Kandaras engaged in threatening communication to silence the Defendant.", claim: "First Amendment (Right to Petition), Fourteenth Amendment (Due Process).", relief: "Sanctions, including Censure and financial penalties." }
    ]
  },
  {
    month: "December 2024",
    events: [
      { id: "20241203", date: "December 3, 2024", title: "Order Striking Defendant's Filings", cause: "The Court issues an order striking the Defendant's pro se motions filed on November 26 and November 29.", effect: "The motions are removed from the record because the Defendant is represented by counsel, continuing the pattern of judicial refusal to consider his pro se arguments.", claim: "First Amendment (Right to Petition), Fourteenth Amendment (Due Process).", relief: "Reversal of order, hearing on merits." },
      { id: "20241205", date: "December 5, 2024", title: "Off-the-Record Young Hearing & Competency Order", cause: "An off-the-record Young Hearing is held. The Court orders a competency evaluation for the Defendant.", effect: "The order is seen as retaliatory, issued without basis immediately after the Defendant argued against his counsel. Defendant is warned against filing further pro se motions.", claim: "Sixth Amendment, Fourteenth Amendment (Due Process), Judicial Misconduct.", relief: "Vacating of competency order, recusal of judge." },
      { id: "20241209", date: "December 9, 2024", title: "Nunc Pro Tunc Order & Writ of Mandamus", cause: "The Court issues an order for competency evaluations, making it 'nunc pro tunc' (retroactive) to the December 5th hearing. Defendant files a Petition for Writ of Mandamus with the Nevada Supreme Court.", effect: "The retroactive order is seen as an attempt to cover up procedural defects. The Writ of Mandamus seeks to compel the lower court to address the alleged systemic violations.", claim: "Fourteenth Amendment (Due Process).", relief: "Supreme Court intervention." },
      { id: "20241216", date: "December 16, 2024", title: "Premature Order to Show Cause", cause: "Court issues an Order to Show Cause (OSC) demanding compliance with the competency evaluation, two months before the February 25, 2025 deadline.", effect: "This action is viewed as retaliatory and procedurally improper, designed to intimidate the Defendant for challenging the court's authority.", claim: "First Amendment (Retaliation), Fourteenth Amendment (Due Process).", relief: "Dismissal of OSC, sanctions." },
      { id: "20241217", date: "December 17, 2024", title: "Bench Warrant Issued for Non-Appearance", cause: "Defendant fails to appear at the OSC hearing, citing a 'reasonable fear of retaliation.' The Court revokes his pretrial release.", effect: "A no-bail bench warrant is issued. The Defendant alleges this violates due process as his absence was justified by fear of a procedurally defective and retaliatory hearing.", claim: "Fourth Amendment (Unreasonable Seizure), Eighth Amendment (Excessive Bail).", relief: "Quashing of warrant." },
      { id: "20241219", date: "December 19, 2024", title: "Warrant and Extradition Authorized", cause: "The Bench Warrant and an Extradition/Transport Authorization are officially filed.", effect: "This formalizes the no-bail hold and authorizes law enforcement to transport the Defendant. The Defendant alleges this is punishment for filing a federal lawsuit.", claim: "First Amendment (Retaliation), Eighth Amendment (Excessive Bail).", relief: "Vacating of warrant and hold." },
      { id: "20241224", date: "December 24, 2024", title: "Defendant Files Multiple Pro Se Motions", cause: "Defendant files several motions, including a Motion to Disqualify Judge Breslow for misconduct and a Motion to Quash the Warrant.", effect: "These motions further detail the allegations of judicial incompetence, bias, and procedural violations in the case.", claim: "Due Process, Judicial Misconduct.", relief: "Recusal of judge, quashing of warrant." }
    ]
  },
  {
    month: "January 2025",
    events: [
      { id: "20250102", date: "January 2, 2025", title: "Motion to Address Judicial Misconduct", cause: "Defendant files a motion for consideration of pending motions and to address a pattern of judicial bias, procedural abuse, and constitutional violations.", effect: "The court's systematic ignoring, suppression, and retaliation against the Defendant's efforts to assert his rights are formally challenged.", claim: "First Amendment (Right to Petition), Fourteenth Amendment (Due Process).", relief: "Ruling on all pending motions, corrective action for misconduct, and sanctions." },
      { id: "20250106", date: "January 6, 2025", title: "State Files Motion for Contempt", cause: "The State of Nevada files a motion for contempt against the Defendant for continuing to file pro per motions.", effect: "The State seeks to punish the Defendant for his continued attempts to petition the court directly, despite being ordered to stop.", claim: "First Amendment (Retaliation), Fourteenth Amendment (Due Process).", relief: "Denial of the State's motion." },
      { id: "20250114", date: "January 14, 2025", title: "Defendant Questions if Rights are Optional", cause: "Defendant files a motion directly asking the court whether constitutional protections apply in the courtroom or are optional.", effect: "The motion highlights a series of alleged violations, including continuances without consent, striking motions without review, and prosecutorial retaliation, demanding clarification.", claim: "First, Sixth, Fourteenth Amendments.", relief: "A clear answer on the application of constitutional protections and an order to uphold them." },
      { id: "20250117", date: "January 17, 2025", title: "State Requests Submission of Contempt Motion", cause: "The State requests that its Motion for Contempt be submitted to the Court for a decision.", effect: "The prosecution pushes for a ruling to hold the Defendant in contempt for his pro se filings.", claim: "Procedural Action.", relief: "N/A." },
      { id: "20250120", date: "January 20, 2025", title: "Defendant Responds to Contempt Motion & OSC", cause: "Defendant files multiple documents, including a note justifying his pro se filings and responses to the contempt motion and the Order to Show Cause.", effect: "The Defendant argues his filings are necessary to protect his rights due to ineffective counsel, collusion, and systemic bias.", claim: "Sixth Amendment (Ineffective Assistance), Fourteenth Amendment (Due Process).", relief: "Denial of contempt motion, vacating of OSC." },
      { id: "20250122", date: "January 22, 2025", title: "Order Vacating Trial Date", cause: "The Court vacates the March 24, 2025 trial date and other hearings.", effect: "The trial is postponed indefinitely pending the outcome of the Defendant's competency evaluation, further delaying the proceedings.", claim: "Sixth Amendment (Right to Speedy Trial).", relief: "Dismissal for speedy trial violations." },
      { id: "20250123", date: "January 23, 2025", title: "Motion to Strike Competency Order", cause: "Defendant files a motion to strike the competency order, vacate the warrant, and dismiss the case for speedy trial violations.", effect: "The motion argues the competency evaluation and bench warrant are retaliatory and part of a pattern of systemic misconduct.", claim: "First, Fourth, Sixth, Eighth, Fourteenth Amendments.", relief: "Strike competency order, vacate warrant, dismiss all charges." }
    ]
  },
  {
    month: "March 2025",
    events: [
      { id: "20250319", date: "March 19, 2025", title: "Defendant Files 'In Praise of Your Shining System'", cause: "Defendant files a motion detailing allegations of a 'procedural horror movie' and systemic corruption, framing the case as potential negligence or a RICO enterprise.", effect: "The filing directly accuses the court and DA's office of withholding evidence, adding charges without due process, weaponizing competency evaluations, and collusion.", claim: "RICO, Brady v. Maryland, Sixth Amendment, Due Process.", relief: "Accountability from the Court and DOJ investigation." }
    ]
  },
  {
    month: "April 2025",
    events: [
      { id: "20250417", date: "April 17, 2025", title: "Defendant Arrested on Warrant", cause: "Defendant is arrested on the bench warrant issued on December 19, 2024.", effect: "Defendant is taken into custody, leading to his ongoing imprisonment and what he alleges are further constitutional injuries.", claim: "First Amendment (Retaliation), Fourth Amendment (Unlawful Seizure).", relief: "Immediate release and compensatory damages." },
      { id: "20250418", date: "April 18, 2025", title: "State Files for No-Bail Hold", cause: "The State files a motion for a no-bail hold, citing the Defendant's criminal history, alleged harassment, and fugitive court filings.", effect: "The State argues that no amount of bail can protect the community, seeking to keep the Defendant incarcerated pending competency proceedings.", claim: "Eighth Amendment (Excessive Bail).", relief: "Denial of no-bail hold and reinstatement of reasonable bail." },
      { id: "20250424", date: "April 24, 2025", title: "Status Hearing & Release Revoked", cause: "A status hearing is held with the Defendant in custody. The State argues for a no-bail hold.", effect: "The court revokes pretrial release, orders the Defendant to be examined for competency, and transfers the case to Competency Court. A new status hearing is set for July 22, 2025.", claim: "Fourteenth Amendment (Due Process).", relief: "Reversal of order, reinstatement of release." },
      { id: "20250425", date: "April 25, 2025", title: "Order for Competency Evaluation", cause: "The Court issues a formal order for competency evaluations, nunc pro tunc to April 24, 2025.", effect: "The case is officially suspended pending the outcome of the evaluation. This action is alleged to be retaliatory for the Defendant's federal filing.", claim: "First Amendment (Retaliation), Fourteenth Amendment (Due Process).", relief: "Dismissal of evaluation, sanctions, compensatory damages." }
    ]
  },
  {
    month: "May 2025",
    events: [
      { id: "20250507", date: "May 7, 2025", title: "Notice of Stricken Document", cause: "The Clerk of the Court strikes an unsigned order filed by defense counsel Galen Carrico.", effect: "A procedural filing by the defense is removed from the record for not being correctly identified as a proposed order.", claim: "Procedural Action.", relief: "N/A." },
      { id: "20250508", date: "May 8, 2025", title: "Counsel Files Motion to Withdraw", cause: "Defense counsel Galen Carrico files a motion to withdraw, citing a 'substantial breakdown in communication' and abusive behavior from the Defendant.", effect: "The attorney-client relationship deteriorates further, leaving the Defendant's representation in question.", claim: "Sixth Amendment (Right to Counsel).", relief: "Appointment of new, effective counsel." },
      { id: "20250513", date: "May 13, 2025", title: "First Competency Evaluation (Coyle)", cause: "A court-ordered forensic psychological evaluation is conducted.", effect: "Dr. Lindsay Coyle opines that the Defendant is NOT competent to stand trial, citing 'abnormal, delusional beliefs about his attorney and the judicial system.'", claim: "Fourteenth Amendment (Due Process).", relief: "Disregard of evaluation due to alleged bias." },
      { id: "20250515", date: "May 15, 2025", title: "Second Competency Evaluation (Pinkerman)", cause: "A second court-ordered forensic psychological evaluation is conducted.", effect: "Dr. Rachael Pinkerman opines that the Defendant IS competent to stand trial, noting that while likely a difficult defendant, he is not diagnosed with a disorder that would impede competency.", claim: "Fourteenth Amendment (Due Process).", relief: "Acceptance of evaluation finding competency." },
      { id: "20250519", date: "May 19, 2025", title: "Request for Submission on Withdrawal", cause: "Counsel Galen Carrico files a request for his Motion to Withdraw to be submitted to the court for a decision.", effect: "The issue of legal representation remains pending before the court.", claim: "Procedural Action.", relief: "N/A." },
      { id: "20250531", date: "May 31, 2025", title: "Substitution of Counsel", cause: "Attorney Samuel Issac Figueroa is substituted in as counsel for the Defendant, replacing Galen Carrico.", effect: "The Defendant has new legal representation, rendering the previous motion to withdraw moot.", claim: "Sixth Amendment (Right to Counsel).", relief: "N/A." }
    ]
  },
  {
    month: "June 2025",
    events: [
      { id: "20250603", date: "June 3, 2025", title: "Court Denies Withdrawal Motion as Moot", cause: "Following the substitution of counsel, the court denies Galen Carrico's motion to withdraw as moot.", effect: "The issue of the previous counsel's withdrawal is officially resolved.", claim: "Procedural Action.", relief: "N/A." },
      { id: "20250605", date: "June 5, 2025", title: "Stipulation for Third Competency Evaluation", cause: "Due to the conflicting reports from the first two evaluations, the State and new defense counsel stipulate to a third evaluation.", effect: "The case is further delayed to resolve the question of competency. The review hearing is continued to July 11, 2025.", claim: "Sixth Amendment (Speedy Trial).", relief: "Objection to further delays." },
      { id: "20250606", date: "June 6, 2025", title: "New Counsel Files Motion to Withdraw", cause: "Just days after being retained, new defense counsel Samuel Figueroa files a motion to withdraw.", effect: "Cites a 'substantial breakdown' and states the Defendant insists on actions Counsel finds repugnant and will not cooperate with the competency evaluation.", claim: "Sixth Amendment (Right to effective counsel).", relief: "Hearing on motion, right to self-representation." },
      { id: "20250609", date: "June 9, 2025", title: "Order for Third Competency Evaluation", cause: "The Court orders a third competency evaluation pursuant to the parties' stipulation.", effect: "The legal process to obtain a third, decisive opinion on the Defendant's competency is officially underway.", claim: "Procedural Action.", relief: "N/A." },
      { id: "20250623", date: "June 23, 2025", title: "Motion to Withdraw Held in Abeyance", cause: "The Court issues an order holding Samuel Figueroa's motion to withdraw in abeyance.", effect: "A decision on the Defendant's legal representation is postponed pending the competency hearing set for July 11, 2025.", claim: "Sixth Amendment (Right to Counsel).", relief: "Immediate ruling on motion to withdraw." },
      { id: "20250625", date: "June 25, 2025", title: "Document Received But Not Considered", cause: "The Defendant submits an inmate request form asking for a bail reinstatement hearing.", effect: "The Court issues a notice that the document was received but not considered, effectively blocking the Defendant's pro se filing.", claim: "First Amendment (Right to Petition), Fourteenth Amendment (Due Process).", relief: "Consideration of document, sanctions, compensatory damages." },
      { id: "20250626", date: "June 26, 2025", title: "Third Competency Evaluation (Foerster)", cause: "The third court-ordered forensic psychological evaluation is conducted.", effect: "Dr. Lisa Foerster opines that the Defendant IS competent to proceed with his case.", claim: "Fourteenth Amendment (Due Process).", relief: "Acceptance of evaluation and immediate resumption of proceedings." },
      { id: "20250630", date: "June 30, 2025", title: "Stipulation of Competence", cause: "With two of the three evaluations finding the Defendant competent, the parties stipulate to enter a finding of competence.", effect: "The State and Defense agree to remand the case back to the trial court, vacating the competency hearing.", claim: "Procedural Action.", relief: "N/A." }
    ]
  },
  {
    month: "July 2025",
    events: [
        { id: "20250701", date: "July 1, 2025", title: "Order Finding Defendant Competent", cause: "Pursuant to the stipulation, the Court issues an order finding the Defendant competent to stand trial.", effect: "The case is remanded back to Department 8 for further proceedings, and the competency issue is formally resolved.", claim: "Procedural Action.", relief: "N/A." },
        { id: "20250730", date: "July 30, 2025", title: "Status Hearing & Bail Reinstated", cause: "A status hearing is held where the Defendant appears in custody.", effect: "The Court reinstates supervised bail. The Defendant is ordered to have no contact with the DA's office and reside with his mother. The motion to withdraw is held in abeyance.", claim: "Eighth Amendment (Excessive Bail).", relief: "Release on reasonable bail conditions." }
    ]
  },
  {
    month: "August 2025",
    events: [
        { id: "20250806", date: "August 6, 2025", title: "Defendant Files Writ of Mandamus", cause: "The Defendant files a pro se Writ of Mandamus, seeking recusal of the judge, release, and other relief.", effect: "The Defendant continues to petition the court directly despite having counsel and being ordered not to.", claim: "First Amendment (Right to Petition).", relief: "Consideration of the writ." },
        { id: "20250807", date: "August 7, 2025", title: "Court Strikes Writ of Mandamus", cause: "The Court strikes the Defendant's Writ of Mandamus.", effect: "The court refuses to consider the pro se filing because the Defendant is represented by counsel.", claim: "First Amendment (Right to Petition), Sixth Amendment (Right to Self-Representation).", relief: "Reversal of order, consideration of the writ." },
        { id: "20250818", date: "August 18, 2025", title: "Pretrial Services Recommends OSC", cause: "The Defendant fails to complete an in-person check-in and begin drug/alcohol testing after his release.", effect: "Pretrial Services submits a recommendation for an Order to Show Cause hearing to address the noncompliance.", claim: "Fourteenth Amendment (Due Process).", relief: "Opportunity to comply before punitive action." },
        { id: "20250822", date: "August 22, 2025", title: "Bench Warrant Issued", cause: "Following a hearing set on August 18th for August 21st, a new bench warrant is issued for the Defendant.", effect: "A no-bail bench warrant is issued, and an extradition and transport authorization is created.", claim: "Eighth Amendment (Excessive Bail), Fourteenth Amendment (Due Process).", relief: "Quashing of warrant." }
    ]
  }
];

const systemicViolationsContent = (
  <div>
      <h3 className="text-xl font-bold font-serif text-yellow-400 mb-4">Monell Liability</h3>
      <p className="mb-6">The sheer volume and systematic nature of the alleged constitutional violations, spanning over 18 months and involving multiple actors, strongly suggest that these are not isolated incidents but rather stem from an unconstitutional municipal policy, widespread custom, or deliberate indifference by the municipality. This institutional failure is the moving force behind the pervasive deprivation of the Plaintiff's rights, thereby establishing Monell liability.</p>
      
      <h3 className="text-xl font-bold font-serif text-yellow-400 mb-4">Conspiracy to Violate Civil Rights</h3>
      <p className="mb-6">The alleged collusion between defense counsel and prosecution, along with the coordinated obstruction of justice by various actors, demonstrates an agreement to deprive the Plaintiff of their civil rights. Each instance of concerted action against the Plaintiff's interests contributes to this conspiracy.</p>

      <h3 className="text-xl font-bold font-serif text-yellow-400 mb-4">RICO Violations</h3>
      <p className="mb-6">The alleged engagement in a "pattern of racketeering activity" through numerous predicate acts (e.g., obstruction of justice, conspiracy against rights) by an "association-in-fact enterprise" directly results in severe financial and constitutional injury to the Plaintiff. The continuity and relationship of these acts establish the pattern required for a RICO claim.</p>
  </div>
);

export const reportSections: ReportSection[] = [
  { id: 'timeline', title: 'Chronological Timeline', content: 'Displaying timeline...' },
  { 
    id: 'summary', 
    title: 'Executive Summary', 
    content: "This Judicial Timeline Report meticulously details a chronological sequence of alleged constitutional and statutory violations in Case No. 3:24-cv-00579-ART-CSD, presented with a clear emphasis on cause-and-effect relationships. Tailored for judicial review, this report maps out potential claims under 42 U.S.C. § 1983, underscores the lower burden of proof in civil litigation, and demonstrates the Plaintiff's exhaustive efforts to seek redress within the state system. The documented misconduct, spanning from February 2024 to the present, reveals a systemic pattern of obstruction, retaliation, and deprivation of fundamental rights, demanding immediate federal accountability." 
  },
  { 
    id: 'introduction', 
    title: 'Introduction & Purpose', 
    content: "The Plaintiff in Case No. 3:24-cv-00579-ART-CSD has presented compelling evidence of a continuous and systematic failure by state actors to uphold constitutional guarantees. The purpose of this report is to provide a direct, unvarnished timeline of these alleged violations, demonstrating a clear linkage between specific actions/inactions by state actors and the resulting constitutional injuries, and irrefutable evidence that the Plaintiff has exhausted all available state remedies, necessitating federal intervention." 
  },
  { 
    id: 'legal', 
    title: 'Legal Framework', 
    content: "42 U.S.C. § 1983 provides a civil cause of action against any person who, acting under color of state law, deprives another of their constitutional rights. To prevail on a § 1983 claim, a plaintiff must prove two elements by a preponderance of the evidence: (1) The defendant acted under color of state law. (2) The defendant deprived the plaintiff of rights, privileges, or immunities secured by the Constitution or laws of the United States. It is critical for this Honorable Court to recognize that the burden of proof in this civil context is not the criminal standard of 'beyond a reasonable doubt.' Instead, the Plaintiff must demonstrate that it is more likely than not that the alleged violations occurred and caused the stated injuries." 
  },
   { 
    id: 'exhaustion', 
    title: 'Exhaustion of Remedies', 
    content: "Plaintiff has diligently pursued every available avenue for redress within the state system, only to be met with a consistent pattern of obstruction, denial, and retaliation. This exhaustive, yet futile, engagement with state processes unequivocally demonstrates that all available state remedies have been exhausted, leaving federal intervention as the sole remaining recourse. Every motion filed, every request made, every attempt to engage with the legal process has been a petition for redress of grievances under the First Amendment. The response at every single juncture has been systematic violation, obstruction, and retaliation. This continuous cycle of denial and adverse action, documented extensively, proves that further attempts to seek relief within the state system would be both futile and an undue burden on the Plaintiff."
  },
  {
    id: 'systemic',
    title: 'Systemic Violations',
    content: systemicViolationsContent,
  },
  {
    id: 'analysis',
    title: 'Violations Analysis',
    content: <ViolationsChart data={timelineData} />,
  },
  { 
    id: 'documents', 
    title: 'Source Documents', 
    content: "This section contains the OCR text from the source documents provided."
  },
  { 
    id: 'conclusion', 
    title: 'Conclusion', 
    content: "The evidence presented in this timeline unequivocally demonstrates a pervasive and ongoing pattern of constitutional and statutory violations against the Plaintiff. The systematic nature of these alleged deprivations, coupled with the Plaintiff's exhaustive, yet unavailing, pursuit of state remedies, necessitates immediate federal intervention. This Honorable Court is respectfully urged to consider the gravity of these allegations and take decisive action to uphold the supremacy of the Constitution and protect the civil rights of all individuals." 
  },
];