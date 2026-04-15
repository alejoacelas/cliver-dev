# Minimal Standard

**Customer Screening Standards Working Group**   
**Meeting \#2**  
April 7, 2026  
9–10:30am PDT | 12–1:30pm EDT  | 5-6:30pm BST  
[**Zoom**](https://us06web.zoom.us/j/82053010099?pwd=40Qfavs1Hb4ay75bhn4IkfwOBTkPJo.1&jst=2)

# **Agenda**

1. Welcome

2. Defining success (10 min)

3. Late Breaking \- Alejandro “attacker stories” (10 min)

4. Draft minimal standard

   1. Read and comment (10 min)

   2. Discussion (45 min)

   3. Fill out form (10 min)

5. Adjourn

# **Outcomes / success**

1) Stakeholders that need to be on board:  
   1) Policymakers (is it feasible / enforceable / auditable)  
   2) Providers (is it reasonable)  
   3) Biosecurity community (is it meaningful)  
        
2) Workshop in late May. After workshop, iterate and send out to all participants to “vote” on each piece.

3) Set cutoffs for how many need to agree out of each stakeholder type to each component before it becomes part of the standard.

   # 

4) # How do we hope the standard will be used? e.g. a policy input, an immediate tool for providers? (Both)

   1) Note that USG and IGSC policies / docs have both influenced each other. We can inform the policymaking processes in part by selling IGSC on it.  (IGSC was just talking about HSP being more a living document)  
   2) There is some chicken-and-egg on industry vs. government; but IGSC seems like an very important advocate

# **Attacker Stories**

Discussion of Alejandro Acelas’s doc: [17 End-to-End Attacks on DNA Order Screening](https://docs.google.com/document/d/1k_58Vu4HhR802WDcExNQm7nkz5zwGnFc9oqu7ZQgyX4/edit?pli=1&tab=t.0#heading=h.rvue7wcp1bkj)

# **Discussion Questions**

1. What kinds of threats does this fail to address? What screening requirements could be added to address those threats?

2. Are there Screening Processes in the current draft that provide negligible biosecurity benefit and could be removed?

3. Which Screening Processes cost money for providers to implement? How significant is the extra cost? 

4. Is the approach to verifying customer legitimacy (below in the table) appropriate? Is verifying institutional legitimacy AND individual legitimacy necessary in a minimal standard or is one sufficient?

   1. What does direct follow-up look like? When is a flag resolved here?

   2. What do providers have to document from these checks?

5. Hard problems: Which customers / providers / supply chains do not fit into this approach? (More hard problems on other tab)

# **Practices and processes for a minimal KYC standard** ([Link to form](https://docs.google.com/forms/d/e/1FAIpQLSfAfk3bB8Nor2gLWyoF81zPvR6xAi6hCc76mA37-4cNAWCU6g/viewform) for feedback.)

[https://docs.google.com/forms/d/e/1FAIpQLSfAfk3bB8Nor2gLWyoF81zPvR6xAi6hCc76mA37-4cNAWCU6g/viewform](https://docs.google.com/forms/d/e/1FAIpQLSfAfk3bB8Nor2gLWyoF81zPvR6xAi6hCc76mA37-4cNAWCU6g/viewform)

| Practice | Screening Process | Purpose | Any/all orders or SOCs (Add unknown???) | Triggers for flags   | Threat Vectors Mitigated | Follow-up action | Is it auditable? | Biosecurity value results | Implementation burden results |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| ***WHAT info should providers COLLECT*** | ***HOW should providers use/screen that information?*** | ***WHY should providers do that?*** |  | ***What are providers looking for when they screen?*** | ***WHO might be stopped by this screening?*** | ***What should providers do with flags?*** |  |  |  |
| Collect basic customer information:  |  |  |  |  |  |  |  |  |  |
| Full name | Screen name against applicable lists of designated persons. | • Initial screen: Verify legitimacy for ordering synDNA. • Follow-up: Establish customer identity (establish if they are the person the list is meant to prohibit)  | All | On national or UN sanctions lists | Honest bad actor. | Follow up re: name collision. Given the information the Provider has access to about the sanctioned individual, collect STRONG or Score 2 information from the customer to verify they are not the sanctioned individual. | Y |  |  |
| Email | Check email address for match with the customer's institutional affiliation. Domain WHOIS lookup; confirm domain matches known institutional domains; confirm address is institutional | • Verify customer identity • Verify customer affiliation | All | • Does not match institution domain• Non-institutional domain | • Honest naive actor (DIY) •Fabricated identity (Falsely claim affiliation) | Direct follow-up re: institutional affiliation. | Y | | |
| Shipping address | Screen shipping address for P.O. Box  | Verify customer identity | All | P.O. Box | Fabricated (or concealed) identity | Direct follow-up. • If institutional affiliation provided, why not ship there? • If no institutional affiliation, biosafety / disposal capabilities? Outcome Non-SOC: Ship at provider discretion. Outcome SOC: Denial except in rare circumstance at provider discretion. | Y | | |
|  | Screen shipping address for residential address | Verify customer identity | All | Residential address | • Honest naive actor (DIY) • Honest bad actor | Direct follow-up re: institutional affiliation. (e.g., Do you have an institutional affiliation? Where are you working with the sequences?) | Y | | |
|  | Screen shipping address for association with institutional affiliation | Verify customer identity | All | No public association between affiliation and shipping address. | Fabricated identity | Follow-up if any other flag raised. |  | | |
|  | Screen shipping address for countries subject to broad (not just SOC) export restrictions.  | Verify customer legitimacy | All | Shipping address in country subject to local comprehensive sanctions or export restrictions | \- \- \- | Deny | Y |  |  |
| Institution | Check that customer is affiliated with their listed institution (low scrutiny) (e.g.,  the customer’s email domain matches their listed institution; customer is shown on the institution’s website). | Verify customer identity | All | The customer cannot demonstrate any ties to the institution. | Fabricated legitimacy | Direct follow-up |  | | |
|  | Screen the institution against national or UN denied parties list. | Verify customer legitimacy | All | Institution on national or UN denied parties list. | Honest bad actor. | Deny | Y |  |  |
|  | Verify the institution is real and relevant to life sciences. (e.g., Confirm org exists via corporate registry or legal ID; check address) | Legitimacy | All | Institution is fabricated (e.g., org has no legal entity or discoverable history on third-party websites) | Fabricated Legitimacy | DIrect follow-up | Y | | |
| Payment method | Check purchasing card’s Bank Identification Number (BIN) to identify gift cards. | Verify customer identity | SOCs | Payment method can be used to obscure identity (e.g., crypto, giftcard) | Fabricated (or concealed) identity | Direct follow-up | Y |  |  |
|  | Do not accept cryptocurrency for payment | Verify customer identity and legitimacy | All | Customer attempts to pay with crypto | Fabricated (or concealed) identity | Deny | Y |  |  |
|  | Screen billing address for association with institutional affiliation. | Verify customer identity | All | Billing address not associated with the institution. | Fabricated identity | Direct follow-up | Y |  |  |
| Phone number | Check phone number for VoIP | Verify customer identity | All | Phone number is VoIP | Fabricated (or concealed) identity | Follow-up if any other flag raised. | Y |  |  |
| Collect evidence to verify customer identity.  (See Table on document’s other tab; Can be performed by the Provider or a third-party identity verification provider.) | Match provided evidence with provided customer information.  | Verify customer identity | SOC | Refusal to provide information. | Fabricated Identity | Deny | Y |  |  |
|  |  |  |  | Mismatch between provided information and identity evidence. |  | Direct follow-up. If concerns not addressed, report. |  |  |  |
| For each order, ask customer if their order contains a SOC.  If they answer “yes,” ask for intended use. | Verify customer declaration aligns with output of sequence screening. | Verify customer legitimacy | All | Customer declares SOC; screening finds none | Honest naive actor | Human review; process order unless other flags. |  |  |  |
|  |  |  |  | Customer does not declare SOC; screening finds SOC | • Honest naive actor • Insider threat • Fabricated legitimacy | Conduct follow-up as normal when SOC is identified with this as a piece of information to inform decision-making. |  |  |  |
| Enable multi-factor authentication (when customer portals are used) | When sequence screening identifies a SOC, confirm that MFA has been turned on for that account (step-up authentication). | Customer authentication | SOC | MFA is not enabled. Repeated MFA failures | Credential theft | Direct customer outreach: Your order cannot be processed until MFA is enabled for your account.  | Y |  |  |
| For each SOC order, document evidence of legitimacy | Screen customer against any existing pre-authorized/ pre-approved lists or designations, and/or against previous company records for past SOC orders and outcomes. | Customer Legitimacy | SOC | A lack of pre-approval does not raise a “flag,” but indicates the provider must verify legitimacy by an alternative mechanism. | Pre-approval facilitates access for good actors. The process of screening for pre-approval does not stop specific bad actors. | Attempt to verify customer’s legitimacy through institution- or individual-based mechanisms (see next rows; may or may not require direct follow-up). |  |  |  |
|  | Institution-based legitimacy:  Confirm that customer is affiliated with institution (Verify institutional email domain; check organization webpage or directory; search publications) Confirm institution is legitimate  (e.g. legally registered, government approvals, clear life sciences connection) | Customer Legitimacy | SOC | Cannot confirm affiliation  and/or  institutional legitimacy. | Fabricated legitimacy  (e.g., claim false affiliation with real institution or claim affiliation with fake institution) | Attempt to verify customer’s legitimacy through individual- or voucher-based mechanisms (see next rows; may or may not require direct follow-up). | Y |  |  |
|  | Individual-based legitimacy: Confirm individual is legitimate user of SOC (e.g. relevant grants awarded to customer, publication history, previous affiliations, biosafety committee approval) Confirm that the customer is affiliated with an institution with a life sciences mission. | Customer Legitimacy | SOC | Cannot confirm individual’s legitimacy for SOC and/or  cannot confirm customer affiliation with some life sciences-related institution  | • Fabricated legitimacy • Honest naive actor (illegitimate user of a SOC) Insider threat (e.g. affiliation is real, but role is irrelevant)  | Attempt to verify customer’s legitimacy through institution- or voucher-based mechanisms (see next row; may or may not require direct follow-up). | Y |  |  |
|  | Voucher-based legitimacy: Provider sends a standardized voucher to the referent which includes: i) the referent’s relationship to customer;  Referent may not be junior to customer. ii) years working together;  Relationship length must be greater than or equal to 1 year (12 months). iii) SOC the customer is ordering or is anticipated to order Referent can indicate whether their voucher is for a single SOC, a taxa, or broader. The Provider can use this as evidence of legitimacy for subsequent SOC orders. iv) assessment of whether the SOC request is necessary for research  Can be short, even one or two sentences. v) “vouch” Confirm the institution-based legitimacy of the referent. Confirm the identity of the voucher with STRONG evidence. | Customer Legitimacy | SOC | Voucher does not demonstrate legitimacy because: i) Customer is senior to referent; ii) Relationship is \<1 year; iii) SOC listed by referent is not aligned with customer order; iv) No—or insufficient—assessment of need for SOC v) Level of trust is below 6\. | • Fabricated legitimacy • Fabricated identity • Honest naive actor • Honest bad actor. | Direct customer follow-up and/or deny order. |  |  |  |
|  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |
| Removed: Payment method | Check that billing name is consistent with stated identity and/or affiliation. | Verify customer identity | All | Billing name does not match account holder or end user.  |  | Follow-up if any other flag raised. |  |  |  |

**Discussion Notes**

- “Any/all orders or SOCs”  
  - HHS Companion Guide: it’s fine for people to order E. coli ribosome sequences to a P.O. box?  
    - How does this handle potential AI-generated sequences?   
    - Splitting:  
      - Clearly benign  
        - Note from Tessa: maybe include “[abiological sequences](https://docs.google.com/document/d/1iqom4lBy0PTNWhicZmE__0sJLOP-_gkjSvU0wfX52v0/edit?tab=t.0#heading=h.n496fjbjzzij)” here   
      - Unknown / designed  
      - SOC  
    - Not needing to positively prove that something is a SOC before these requirements trigger (guilty until proven innocent)  
  - IGSC HSP says “don’t send to residential addresses”  
- Domains / emails not reliable, too many cyber attacks are possible

Vouchers / IBCs \- can often require outside members so it’s not just people in the country. 

- In USA, you need IBC for federal funding from the NIH, which also includes many pharma companies and other groups; also some counties / states require IBCs as well (e.g. Massachusetts)  
  - The NIH does include something on sequences you plan to order (materials)  
  - Personnel should be listed  
- In Africa (Kenya, Uganda, South Africa, Nigeria), this was the “go-to” within academia; there tends to be a country-wide IBC network or association, fairly easy to train / add a section to what they are already monitoring; not a big burden if they receive training; at least in South Africa and Nigeria, startups also have IBC  
  - Probably counts as individual *and* institutional  
  - Junior PhD students should also be listed with IRB / IBC approvals  
  - Close relationships with gov’t regulators  
  - What do IBC approvals look like?  
    - There is already a section on “recombinant technology”, list of pathogens being worked on, self-declaration… comes down to biorisk assessment training as well  
    - A form / a letter?  Can we add fields of “in this research, we anticipate the need to order synNA from these taxa.”  
  - Agreed IBCs are under-resourced — just no better resourced alternative at least in African market\!  
- CLTR: pushback during cost-benefit on IRB approvals, can sometimes meet only 4 times per year at a university, if you have to wait until they meet  
  - Gating “get my NAs” on “someone else answers an email” \= would be strongly opposed by UK BIA, not wanting to introduce a second approver  
  - But should be okay if it’s a cascading thing, IBC as third tier of fallback assurance  
- Sharkey: in US, lots of resistance to adding responsibilities to IBCs  
  - Feels like "Why implementation gaps could undermine synthetic nucleic acid oversight" [https://www.frontiersin.org/journals/bioengineering-and-biotechnology/articles/10.3389/fbioe.2025.1689753/full](https://www.frontiersin.org/journals/bioengineering-and-biotechnology/articles/10.3389/fbioe.2025.1689753/full) (from two biosafety officers) is relevant here  
  - But if it is just an extra line on a form and especially if it could be tied to NIH and be automated, that would be great.  
    - @Matt Sharkey This hasn’t happened yet, but there’s a lot of chatter about making all IBC project meeting minutes and registrations public on the NIH website as part of their modernization initiative  
- From Alejandro:  
  - Mostly agree with what people have said here about the frictions introduced by vouching. What I’d really want is that a meaningful fraction of attackers are faced with some vouching requirements, but if we can’t target them well probably best to skip widespread requirements of that sort   
  -   
  - (But vouching can still be pretty useful in cases where there’s less centralized institutions that we can ping for verification)  
- From Kevin:  
  - I’m thinking about institutional checks (e.g., you can get incorporation documents) vs individual checks (e.g., you can get the individual’s ID). The individual ID checks while very doable technically would be a pretty big change for how these materials are ordered today and create a lot of work on developing a robust standard. We should strongly believe individual checks are a strong deterrent / informs risk, investigation, or some type of action before we invest all that effort  
- From Evan:  
  - [https://www.tandfonline.com/doi/full/10.1080/25741292.2020.1725366\#abstract.I](https://www.tandfonline.com/doi/full/10.1080/25741292.2020.1725366#abstract.I)   
  - Highlights some of the shortcomings of KYC policies in the financial sector

# Resources: Verify Identity

**Evidence required by NIST and GPG for verifying individual’s identity:**

|  | NIST 800-63 | GPG 45 |
| :---- | :---- | :---- |
| **Lowest Level** | FAIR evidence Financial Account Phone Account Student ID Card Corporate ID Card Veteran ID card SNAP Card with Facial Portrait  | **Score 1:** The evidence will have a score of 1 if it contains at least 2 of the following pieces of information: ● the claimed identity's name ● the claimed identity's date of birth ● the claimed identity's place of birth ● the claimed identity's address ● the claimed identity’s biometric information (these are measurements of biological or behavioural attributes, like an iris or fingerprint) ● a photo of the claimed identity ● a reference number |
| **Second Level** | STRONG evidence Driver’s License or State ID (physical) Permanent Resident Card (issued prior to May 11, 2010\) U.S. Uniformed Services Privilege and Identification Card Native American Tribal Photo Identification Card Veteran Health ID Card (VHIC) USCIS Security-Enhanced Travel Documents (I-571/I-327)  | **Score 2**: a Home Office travel document (convention travel document, stateless person’s document, one-way document or certificate of travel) a birth or adoption certificate an older person’s bus pass an education certificate from a regulated and recognised educational institution (such as an NVQ, SQA, GCSE, A level or degree certificate) a rental or purchase agreement for a residential property a proof of age card recognised under the Proof of Age Standards Scheme (PASS) a Freedom Pass a marriage or civil partnership certificate a gas or electric account a firearm certificate a ‘substantial’ electronic identity’ from a notified eIDAS scheme  |
|  | SUPERIOR evidence Personal Identity Verification (PIV) Card Personal Identity Verification-Interoperable (PIV-I) Card Common Access Card (CAC) US Passport International e-Passports Mobile Driver’s License (MDL) Digital Permanent Resident Card (Verifiable Credential) European Digital Identity Wallet (EUDI Wallet) Personal Identification (PID) Element Japan’s My Number Card   | **Score 3**: passports that meet the [International Civil Aviation Organisation (ICAO) specifications for machine-readable travel documents](https://www.icao.int/publications/pages/publication.aspx?docnum=9303), such as a South African passport identity cards from an EU or European Economic Area (EEA) country that follow the [Council Regulation (EC) No 2252/2004 standards](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX%3A32004R2252) UK photocard driving licences EU or EEA driving licences that follow the [European Directive 2006/126/EC](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A32006L0126) a Northern Ireland electoral identity card a US passport card a bank, building society or credit union current account (which the claimed identity can show by giving you a bank card) a student loan account a credit account a mortgage account (including buy to let mortgage accounts) a [digital tachograph driver smart card](https://www.gov.uk/apply-for-a-digital-tachograph-driver-smart-card) an armed forces identity card a proof of age card recognised under PASS with a unique reference number a loan account (including hire purchase accounts) a ‘[high](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32015R1502&from=EN)’ electronic identity from a [notified eIDAS scheme](https://ec.europa.eu/cefdigital/wiki/display/EIDCOMMUNITY/Overview+of+pre-notified+and+notified+eID+schemes+under+eIDAS)  |

[Fair evidence](https://pages.nist.gov/800-63-4/sp800-63a/evidence/#table-A1)  
[Strong evidence](https://pages.nist.gov/800-63-4/sp800-63a/evidence/#table-A2)

[GPG45](https://www.gov.uk/government/publications/identity-proofing-and-verification-of-an-individual/how-to-prove-and-verify-someones-identity#why-you-should-not-accept-a-national-insurance-number-as-proof-of-identity)

# Resources: Verify Legitimacy

**Institutional Legitimacy**  
**Resources for Verifying Institutional Legitimacy**

* Global Legal Entity Identifier Foundation [https://www.gleif.org](https://www.gleif.org)  
* Ringgold ([https://www.ringgold.com/](https://www.ringgold.com/)),   
* Research Organisation Registry ([https://ror.org/](https://ror.org/)) useful here globally.   
* *UK-specific:* Companies House ([https://www.gov.uk/government/organisations/companies-house](https://www.gov.uk/government/organisations/companies-house)) and Charity Commission ([https://www.gov.uk/government/organisations/charity-commission](https://www.gov.uk/government/organisations/charity-commission))

* [https://incommon.org](https://incommon.org) \- has products and services, one that is known is eduroam which some people encounter while just getting onto WiFi networks at other institutions [https://incommon.org/eduroam/](https://incommon.org/eduroam/)

**Individual Legitimacy**  
**Resources for Verifying Individual Legitimacy**

* Vouch: UK Guidance from the Office for Digital Identities and Attributes and Department for Science, Innovation and Technology — [How to create a vouch as evidence of someone’s identity (1.0)](https://www.gov.uk/government/publications/how-to-create-a-vouch-as-evidence-of-someones-identity-1-0/how-to-create-a-vouch-as-evidence-of-someones-identity-1-0-pre-release) 

**Example of individual legitimacy verification:**

* GA4GH passports: [https://www.ga4gh.org/product/ga4gh-passports/](https://www.ga4gh.org/product/ga4gh-passports/)

# Hard Problems

**Hard Problems**

1. What KYC is needed when the end user is not placing the order? (e.g. procurement officers; third-party vendors; autonomous labs) OR when the grad student uses the PI’s credentials.  
   1. It is common to have a single procurement individual at companies  
   2. Lab manager / PI likely to place orders for graduate students \*but some place orders themselves)  
   3. Procurement officer would have to go back and do KYC for the person they are ordering for than it would be to provide their own ID for innocuous orders.  
      1. Record keeping and downstream investigations is as much the point as deterrence. 

   

2. What should be the minimal standard for benchtops? Do we expect / support any on-device authentication, or is all KYC at sale-time?

3. What “breaks” when the minimal standard is applied to workstreams without customer log-in portals (e.g., emails; whatsapp)?  
     
4. What level of identity verification is needed for SOCs vs all orders and does that exclude researchers from specific countries or regions?  
   1. If we screen in depth for all orders that do not contain SOCs, we will have very slow processes that do not help industry because the best actors gets slowed down.  
   2. “Liveness check” may be more necessary for DNA than beer, since beer is purchased in-person (“Know Your Agent”)  
   3. Record the identity  
      1. Check the id and keep a record; but not trying to restrict sales for non-SOCs  
      2. The whole goal of FAIR evidence is just to take a single step beyond “here’s my name\!”  
         1. Catching payment information is useful because the identity back-up against financial   
      3. Record of “who you sold stuff to” can help with attribution / investigation  
   4. How much does this help with deterrence? Different takes  
      1. “My understanding is that people with malicious intentions will have a very strong preference to remain anonymous/not be registered in any systems, even if they are confident that the materials won’t be flagged”

   

5. Acceptable level of evidence of customer affiliation with an institution (see Tessa’s table in [Verifying Affiliation ](https://docs.google.com/document/d/1jVfg1beniZ3R4bKY2qRkIC44A884-H339e6UVbmaBMA/edit?tab=t.0#heading=h.so8dxoh0op85))
