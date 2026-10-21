import type {
  ContractSection,
  ContractTemplateVariableKey,
  ContractTemplateVariables,
  ContractTextPart,
  EmploymentContractData,
} from "../types";
import {
  formatContractMoney,
  formatContractMoneyEN,
  numberToEnglishBahtText,
  numberToThaiBahtText,
} from "../formatContractData";

const text = (value: string, bold = false): ContractTextPart => ({
  text: value,
  bold,
});

const variable = (
  key: ContractTemplateVariableKey,
  bold = true
): ContractTextPart => ({
  text: "",
  dynamic: true,
  bold,
  variable: key,
});

export const employment119DaysPageOneIntroduction: {
  th: ContractTextPart[];
  en: ContractTextPart[];
} = {
  th: [
    text("เลขที่สัญญา "),
    variable("contractNo"),
    text(" วันที่ "),
    variable("contractDateTH"),
    text(" ระหว่าง "),
    variable("companyNameTH"),
    text(" โดย "),
    variable("employerNameTH"),
    text(" ตำแหน่ง "),
    variable("employerPositionTH"),
    text(" ซึ่งต่อไปในสัญญาฉบับนี้เรียกว่า ‘นายจ้าง’ ฝ่ายหนึ่ง และ "),
    variable("employeeNameTH"),
    text(" ที่อยู่ "),
    variable("employeeAddressTH"),
    text(" ซึ่งต่อไปในสัญญาฉบับนี้เรียกว่า ‘ลูกจ้าง’ อีกฝ่ายหนึ่ง"),
  ],
  en: [
    text("Contract No. "),
    variable("contractNo"),
    text(" dated "),
    variable("contractDateEN"),
    text(" between "),
    variable("companyNameEN"),
    text(", represented by "),
    variable("employerNameEN"),
    text(", position "),
    variable("employerPositionEN"),
    text(", hereinafter referred to as the “Employer”, of the one part, and "),
    variable("employeeNameEN"),
    text(", residing at "),
    variable("employeeAddressEN"),
    text(", hereinafter referred to as the “Employee”, of the other part."),
  ],
};

export const employment119DaysSections: ContractSection[] = [
  {
    no: "1",
    th: [
      text("นายจ้างตกลงจ้าง "),
      variable("employeeNameTH"),
      variable("employeeNicknameTH"),
      text(" ให้ทำงานในตำแหน่ง "),
      variable("positionTH"),
      text(" ระดับ "),
      variable("level"),
      text(" แผนก "),
      variable("departmentTH"),
      text(" ฝ่าย "),
      variable("divisionTH"),
      text(" ของบริษัท "),
      variable("companyNameTH"),
      text(" ตั้งแต่วันที่ "),
      variable("startDateTH"),
      text(" ถึง วันที่ "),
      variable("endDateTH"),
      text(" โดยสัญญาฉบับนี้ทำขึ้นเป็น "),
      variable("durationDays"),
      text(" วัน"),
    ],
    en: [
      text("The employer agrees to hire "),
      variable("employeeNameEN"),
      variable("employeeNicknameEN"),
      text(" to work as "),
      variable("positionEN"),
      text(" at "),
      variable("level"),
      text(" level in the "),
      variable("departmentEN"),
      text(" Department, "),
      variable("divisionEN"),
      text(" Division of "),
      variable("companyNameEN"),
      text(" from "),
      variable("startDateEN"),
      text(" to "),
      variable("endDateEN"),
      text(" for a total of "),
      variable("durationDays"),
      text(" days."),
    ],
  },
  {
    no: "2",
    th: [
      text("ลูกจ้างจะได้รับค่าจ้างในอัตราเดือนละ "),
      variable("salary"),
      text(" ("),
      variable("salaryTextTH"),
      text(")"),
      text(" ค่าตำแหน่ง "),
      variable("positionAllowance"),
      text(" ("),
      variable("positionAllowanceTextTH"),
      text(")"),
      text(" รวมทั้งหมด "),
      variable("totalSalary"),
      text(" ("),
      variable("totalSalaryTextTH"),
      text(")"),
      text(" (ก่อนหักภาษีเงินได้ และประกันสังคม)"),
    ],
    en: [
      text("The employee will be paid "),
      variable("salaryEN"),
      text(" ("),
      variable("salaryTextEN"),
      text(")"),
      text(" per month, with a position allowance of "),
      variable("positionAllowanceEN"),
      text(" ("),
      variable("positionAllowanceTextEN"),
      text(")"),
      text(", for a total of "),
      variable("totalSalaryEN"),
      text(" ("),
      variable("totalSalaryTextEN"),
      text(")"),
      text(" (before income tax and social security deductions)."),
    ],
  },
  {
    no: "3",
    th: [
      text("รายการค่าใช้จ่าย หรือหนี้สินที่ต้องหักให้หัก ลูกจ้างยินยอมให้หักจากผลตอบแทนตามข้อ (2) ทุกรายการ"),
    ],
    en: [
      text("Expenses or liabilities that must be deducted may be deducted from the remuneration under Clause (2) for all transactions."),
    ],
  },
  {
    no: "4",
    th: [text("ลูกจ้างจะต้องดำเนินการยื่นภาษีเงินได้บุคคลธรรมดา ประจำปี (ภงด.90/91) ให้ถูกต้องตามกฎหมายประเทศไทยด้วยตนเอง ตลอดจนค่าใช้จ่ายหรือค่าภาษีที่จะต้องจ่าย ลูกจ้างจะต้องจ่ายด้วยเงินของตนเองทั้งสิ้น")],
    en: [text("The employee must file the annual personal income tax return (PND 90/91) in accordance with Thai law and is responsible for all related expenses and taxes." )],
  },
  {
    no: "5",
    th: [text("นอกเหนือจากค่าจ้างแล้วลูกจ้างยังคงได้รับสวัสดิการอื่นเพิ่มเติม โดยให้อ้างอิงตามกฎระเบียบที่นายจ้างได้ประกาศใช้ในแต่ละปี นายจ้างยังคงถือสิทธิในการแก้ไข เปลี่ยนแปลง หรือยกเลิกได้ตามความเหมาะสม เช่น ค่าโทรศัพท์ เงินสนับสนุนด้านการศึกษาพนักงาน")],
    en: [text("In addition to wages, the employee may receive additional benefits under the employer's regulations announced each year. The employer retains the right to amend, change, or cancel them as appropriate." )],
  },
  {
    no: "6",
    th: [text("ภายในระยะเวลา "), variable("durationDays"), text(" วัน หากลูกจ้างทำผิดสัญญา หรือผลงานไม่ได้ตามที่ตกลงกันไว้ นายจ้างสามารถบอกเลิกสัญญาได้โดยไม่ต้องบอกกล่าวล่วงหน้า")],
    en: [text("Within a period of "), variable("durationDays"), text(" days, if the employee breaches the contract or performance does not meet the agreed standards, the employer may terminate the contract without prior notice." )],
  },
  {
    no: "7",
    th: [text("การรักษาพยาบาล โดยใช้สิทธิทางด้านประกันสังคมและกองทุนเงินทดแทน ซึ่งรวมถึงบริการของโรงพยาบาลของรัฐด้วย ยกเว้นลูกจ้างต่างชาติจะต้องได้รับใบอนุญาตทำงานแล้วเท่านั้นและจะต้องนำส่งไปประกันสังคม 3 งวด ลูกจ้างสามารถใช้สิทธิ์ได้ตามกฎหมายของประเทศไทย")],
    en: [text("Medical treatment shall use social security and compensation fund rights, including public hospital services. Foreign employees must first obtain a work permit and complete three social-security contributions before exercising their rights under Thai law." )],
  },
  {
    no: "8",
    th: [text("ลูกจ้างจะให้การสนับสนุนด้านนโยบายหลักของบริษัทฯ และกลุ่มธุรกิจในเครือฯ จะทำงานในหน้าที่ที่ได้รับมอบหมายอย่างสุดความสามารถ โดยจะไม่ประกอบธุรกิจอื่นหรือรับจ้างทำงานที่อื่นนอกเวลางานจนทำให้มีผลกระทบกับงานหลัก ยกเว้นได้รับอนุญาตจากนายจ้างในงานนั้น")],
    en: [text("The employee shall support the Company's core policies and affiliated businesses, perform assigned duties to the best of their ability, and not engage in other work that affects their principal duties unless permitted by the employer." )],
  },
  {
    no: "9",
    th: [text("ลูกจ้างจะต้องรักษามารยาทและความประพฤติให้เหมาะสมอยู่ตลอดเวลา ทั้งในและนอกเวลาทำงาน ให้เกิดภาพลักษณ์ที่ดีต่อนายจ้างและ/หรือต่อบริษัทฯ")],
    en: [text("The employee must maintain appropriate manners and conduct at all times, both during and outside working hours, and preserve a good image for the employer and/or the Company." )],
  },
  {
    no: "10",
    th: [text("ลูกจ้างจะต้องอยู่ใต้การบังคับบัญชาของ กรรมการผู้จัดการ และ/หรือผู้จัดการทั่วไปของบริษัทฯ โดยให้ถือข้อกำหนดเกี่ยวกับหน้าที่และความรับผิดชอบของตำแหน่งซึ่งแนบท้ายสัญญาและ/หรือข้อตกลงที่บริษัทฯ ออกเป็นครั้งคราว เป็นส่วนหนึ่งของสัญญานี้ด้วย")],
    en: [text("The employee shall be under the command of the Managing Director and/or General Manager. The duties and responsibilities attached to this contract and any Company agreements issued from time to time form part of this contract." )],
  },
  {
    no: "11",
    th: [text("นายจ้างอาจยุติการจ้างลูกจ้างด้วยสาเหตุต่าง ๆ ซึ่งรวมถึงเรื่องต่อไปนี้:-")],
    en: [text("An employer may terminate an employee for various reasons, including the following:-")],
    children: [
      { no: "11.1", th: [text("เหตุผลเกี่ยวกับทุจริตหรือความเหลวแหลกในศีลธรรม การประพฤติปฏิบัติที่ไม่ดีต่อบริษัทฯ ผลงานที่ไม่ได้ตามมาตรฐานที่บริษัทฯ กำหนด")], en: [text("Corruption, moral misconduct, conduct detrimental to the Company, or performance that does not meet Company standards." )] },
      { no: "11.2", th: [text("บริษัทฯ ประสบปัญหาได้รับผลกระทบจากปัญหาเศรษฐกิจ การเมือง และสังคม ทำให้เกิดภาวะวิกฤตไม่สามารถดำเนินกิจการต่อได้")], en: [text("The Company is affected by economic, political, or social problems that cause a crisis and prevent continued operation." )] },
      { no: "11.3", th: [text("ลูกจ้างกระทำผิดร้ายแรงกับบริษัทฯ เจตนาให้บริษัทฯ เกิดความเสียหาย หรือการกระทำที่ส่งผลกระทบต่อชื่อเสียงและความมั่นคงขององค์กร เช่น ลบไฟล์ข้อมูลของบริษัทฯ หรือทำลายเอกสารสำคัญของบริษัทฯ เป็นต้น")], en: [text("The employee commits serious offences against the Company, intentionally causes damage, or acts against its reputation and stability, such as deleting data files or destroying important documents." )] },
      { no: "11.4", th: [text("ลูกจ้างขาดงานมากกว่า 3 วัน โดยไม่ได้ติดต่อประสานงานให้ทางบริษัทฯ ทราบ")], en: [text("The employee is absent from work for more than 3 days without contacting the Company." )] },
    ],
  },
  {
    no: "12",
    th: [text("หากฝ่ายใดฝ่ายหนึ่งประสงค์จะยุติสัญญานี้ก่อนสิ้นสุดสัญญาจ้างจะต้องแจ้งให้อีกฝ่ายหนึ่งได้ทราบเป็นลายลักษณ์อักษรเป็นระยะเวลาล่วงหน้า ไม่น้อยกว่า 15 วัน หากเป็นผู้บริหารระดับผู้จัดการขึ้นไปจะต้องลาออกล่วงหน้าอย่างน้อย 30 วัน โดยระบุอย่างชัดเจนว่าต้องการยุติสัญญานี้ บริษัทฯ จะไม่มีการจ่ายค่าชดเชย หรือค่าบอกกล่าวล่วงหน้าใด ๆ ทั้งสิ้น")],
    en: [text("If either party wishes to terminate this contract before its end, written notice must be given at least 15 days in advance. Managers and above must give at least 30 days' notice. The Company will not pay compensation or payment in lieu of notice." )],
  },
  {
    no: "13",
    th: [text("เรื่องการเปิดเผยหรือใช้ข้อมูลเอกสารภายในและการรักษาข้อมูลอันเป็นความลับ ลูกจ้างตกลงว่าจะไม่เปิดเผยข้อมูลเกี่ยวกับบริษัทฯ หรือกลุ่มธุรกิจในเครือ หรือเปิดเผยข่าวสารใด ๆ เกี่ยวกับการเจรจาติดต่อ งานต่าง ๆ ซึ่งลูกจ้างได้รับทราบในระหว่างที่ทำงานอยู่กับนายจ้าง ทั้งในขณะทำงานอยู่หรือออกจากงานไปแล้ว ดังนี้")],
    en: [text("Disclosure or use of internal documents and confidential information is prohibited. The employee shall not disclose Company or affiliated-business information learned during employment, whether during or after employment, as follows:" )],
    children: [
      { no: "13.1", th: [text("ลูกจ้างจะต้องรักษาความลับข้อมูลความลับทางธุรกิจของบริษัทฯ อย่างเคร่งครัด ไม่ให้รั่วไหลไปยังบุคคลที่ไม่เกี่ยวข้อง ซึ่งอาจก่อให้เกิดความเสียหายแก่องค์กร")], en: [text("The employee must strictly maintain the confidentiality of the Company's business secrets and prevent disclosure to unrelated persons." )] },
      { no: "13.2", th: [text("ห้ามลูกจ้างใช้โอกาส หรือข้อมูลที่ได้จากการเป็นพนักงาน หัวหน้าแผนก หรือผู้บริหาร ในการหาประโยชน์ส่วนตัว เพื่อให้บุคคลที่สาม หรือทำธุรกิจที่แข่งขันกับบริษัทฯ และหรือธุรกิจที่เกี่ยวเนื่อง ถึงแม้จะพ้นสภาพการเป็นพนักงานของบริษัทฯ ไปแล้ว")], en: [text("The employee must not use opportunities or information obtained through employment for personal gain, third parties, competing businesses, or related businesses, including after employment ends." )] },
      { no: "13.3", th: [text("ห้ามลูกจ้างดัดแปลง เปลี่ยนแปลง แก้ไขข้อมูลเอกสาร ไม่ว่าทั้งหมดหรือบางส่วนที่มีนัยสำคัญ หรือสาระสำคัญที่อาจส่งผลกระทบต่อชื่อเสียง และความมั่นคงของบริษัทฯ ให้กับบุคคลภายนอก")], en: [text("The employee must not alter or modify material Company documents in whole or in part, or provide them to third parties in a way that may affect the Company's reputation or security." )] },
      { no: "13.4", th: [text("ห้ามลูกจ้างกระทำการคัดลอก ถ่ายรูป หรือเผยแพร่ข้อมูลเอกสารของบริษัทฯ ลงบนสื่อต่าง ๆ ให้กับบุคคลภายนอก โดยไม่ได้รับอนุญาตจากทางบริษัทฯ")], en: [text("The employee must not copy, photograph, or disseminate Company documents through any media to third parties without permission." )] },
      { no: "13.5", th: [text("ห้ามลูกจ้างใช้คำพูดที่พาดพิง หรือทำให้เสียหายซึ่งส่งผลกระทบต่อชื่อเสียง และความมั่นคงของบริษัทฯ ไม่ว่าจะโดยทางตรง หรือทางอ้อม")], en: [text("The employee must not make statements that directly or indirectly damage the Company's reputation or stability." )] },
      { no: "13.6", th: [text("ห้ามลูกจ้างนำเอกสารของบริษัทฯ ออกนอกบริษัท โดยไม่ได้รับอนุญาตจากหัวหน้างาน")], en: [text("The employee must not take Company documents outside the Company without permission from a supervisor." )] },
      { no: "13.7", th: [text("ลูกจ้างบุคคลใดที่กระทำการฝ่าฝืนกฎระเบียบข้อบังคับการเปิดเผยข้อมูลอันเป็นความลับของบริษัทฯ จะมีความผิดทางวินัยสถานหนัก โดยบริษัทฯ พิจารณาเลิกจ้างโดยไม่จ่ายค่าชดเชยและไม่จำเป็นต้องออกหนังสือเตือนเป็นลายลักษณ์อักษรก่อน และจะถูกดำเนินคดีตามกฎหมายตามลำดับ")], en: [text("An employee who violates the Company's confidentiality rules is subject to serious disciplinary action, including dismissal without compensation or prior written warning, and may be prosecuted under applicable law." )] },
    ],
  },
  {
    no: "14",
    th: [text("ข้อตกลงเพิ่มเติม ด้านทรัพย์สิน ชุดข้อมูล และไฟล์งาน")],
    en: [text("Additional Property Agreements, Datasets and Work Files")],
    children: [
      { no: "14.1", th: [text("อุปกรณ์ประจำตัวลูกจ้าง เป็นทรัพย์สินของบริษัทฯ ที่ลูกจ้างยืมใช้ระหว่างปฏิบัติงาน เช่น คอมพิวเตอร์ โน้ตบุ๊ค โทรศัพท์มือถือ และแท็บเล็ต ลูกจ้างต้องดูแลรักษาเสมือนเป็นทรัพย์สินของตนเอง หากเกิดความเสียหายเนื่องจากความประมาทเลินเล่อ ไม่รวมถึงการเสียหายที่ใช้ในการทำงาน ลูกจ้างจะต้องรับผิดชอบต่อความเสียหายที่เกิดขึ้นด้วยตนเอง และต้องส่งคืนเมื่อสิ้นสุดการจ้าง")], en: [text("Employee devices borrowed for work, including computers, notebooks, phones, and tablets, remain Company property. The employee must take proper care, is responsible for negligent damage, and must return them when employment ends." )] },
      { no: "14.2", th: [text("รหัสความปลอดภัย User และ Password ที่นายจ้างมอบหมายให้ลูกจ้างดูแลจะต้องเก็บไว้เป็นความลับ ห้ามส่งต่อให้บุคคลอื่นโดยเด็ดขาด และลูกจ้างจะต้องส่งคืนนายจ้างเมื่อลูกจ้างลาออก")], en: [text("User names, passwords, and security codes assigned by the employer must remain confidential, must not be shared, and must be returned to the employer when employment ends." )] },
      { no: "14.3", th: [text("ชุดข้อมูล ไฟล์งาน ที่ลูกจ้างเป็นผู้สร้าง หรือมีส่วนร่วมในการสร้าง เขียน หรือแก้ไขในระหว่างการปฏิบัติงาน ถือเป็นทรัพย์สินของนายจ้าง ห้ามลูกจ้างลบ แก้ไข หรือส่งต่อเด็ดขาด และต้องส่งคืนนายจ้างเมื่อสิ้นสุดการจ้าง")], en: [text("Datasets and work files created or contributed to by the employee during employment are the employer's property. They must not be deleted, altered, or forwarded and must be returned when employment ends." )] },
      { no: "14.4", th: [text("ห้ามส่งต่อเครื่องแบบพนักงานให้กับผู้อื่นหรือบุคคลภายนอก และ/หรือสวมใส่ไปในสถานที่ที่ไม่เหมาะสม")], en: [text("Employee uniforms must not be transferred to other persons or worn in inappropriate places." )] },
    ],
  },
  {
    no: "15",
    th: [text("ระเบียบในการลา")],
    en: [text("Leave Regulations")],
    children: [
      { no: "15.1", th: [text("วันลานักขัตฤกษ์ สิทธิการใช้วันลานักขัตฤกษ์สามารถใช้ได้นับตั้งแต่เริ่มงานวันแรก นายจ้างอนุญาตให้ใช้สิทธิได้ในภายหลัง แต่ไม่เกินวันที่ 30 กันยายน ของปีถัดไป")], en: [text("Public-holiday entitlement starts on the first day of work and may be exercised later with employer approval, but no later than September 30 of the following year." )] },
      { no: "15.2", th: [text("วันลาพักร้อน สิทธิการใช้วันลาพนักงานสามารถใช้ได้เมื่อมีอายุงานครบ 1 ปี โดยนับจากวันเริ่มทำงานวันแรก และต้องใช้สิทธิวันลาพักร้อนของปีปัจจุบันให้เสร็จสิ้นก่อนถึงวันครบกำหนดอายุงานปีถัดไป")], en: [text("Vacation entitlement is available after one year of service. The employee must use the current year's vacation before the next service anniversary." )] },
    ],
  },
  {
    no: "16",
    th: [text("การฝึกอบรมเป็นส่วนสำคัญในการทำงาน ลูกจ้างทุกคนจะต้องเข้ารับการอบรมตามนโยบายที่นายจ้างได้วางเอาไว้ ซึ่งตารางการอบรมจะออกโดยฝ่ายบริหาร หากพนักงานฝ่าฝืนไม่เข้ารับการอบรมตามที่บริษัทฯ กำหนดถือเป็นการทำผิดกฎของบริษัทฯ")],
    en: [text("Training is an important part of the job. All employees must attend training in accordance with the employer's policy. Failure to attend required training is a violation of Company rules.")],
    children: [
      { no: "-", th: [text("หลักสูตรทั่วไป คือ หลักสูตรการอบรมพื้นฐานที่นายจ้างจัดให้พนักงานได้รับการฝึกอบรมหลักสูตรใดก็ตาม ถือเป็นสวัสดิการอย่างหนึ่ง ซึ่งพนักงานเป็นผู้รับประโยชน์โดยฝ่ายเดียว")], en: [text("General courses are basic training provided by the employer as an employee benefit." )] },
      { no: "-", th: [text("หลักสูตรพิเศษ คือ หลักสูตรพิเศษที่นายจ้าง และลูกจ้างได้มีข้อตกลงร่วมกันภายใต้เงื่อนไขเพิ่มเติม เช่น นายจ้างจะเป็นฝ่ายออกค่าใช้จ่ายในการอบรม แต่ลูกจ้างจะต้องนำความรู้หรือเทคนิคที่ได้รับมาเผยแพร่ หรือใช้เพื่อพัฒนาองค์กรตามระยะเวลาที่กำหนด โดยทางนายจ้างจัดทำสัญญาให้ลูกจ้างลงนามในเอกสารภายหลังแยกจากสัญญาจ้าง")], en: [text("Special courses are agreed under additional conditions. The employer may pay the training cost, while the employee must apply and share the knowledge within the agreed period under a separate training agreement." )] },
    ],
  },
  {
    no: "",
    th: [text("หนังสือสัญญาจ้างฉบับนี้ ข้าพเจ้าได้อ่านทำความเข้าใจ และยินยอมรับเงื่อนไขในข้อปฏิบัติ ระเบียบของบริษัทฯ ที่ระบุในสัญญานี้โดยตลอดแล้วจึงได้ลงนามในสัญญาจ้างนี้เพื่อเป็นหลักฐานการว่าจ้าง")],
    en: [text("I have read, understood, and accepted all terms, conditions, and regulations of the Company as stated in this Employment Agreement. I hereby sign this Agreement as evidence of my acceptance of employment under the specified terms." )],
  },
];

export function resolveContractTextParts(
  parts: ContractTextPart[],
  variables: ContractTemplateVariables
): ContractTextPart[] {
  return parts.map((part) => {
    if (!part.dynamic || !part.variable) return { ...part };

    return {
      ...part,
      text: variables[part.variable],
    };
  });
}

export function resolveContractSections(
  sections: ContractSection[],
  variables: ContractTemplateVariables
): ContractSection[] {
  return sections.map((item) => ({
    ...item,
    th: resolveContractTextParts(item.th, variables),
    en: item.en ? resolveContractTextParts(item.en, variables) : undefined,
    children: item.children
      ? resolveContractSections(item.children, variables)
      : undefined,
  }));
}

function displayText(value: string | null | undefined): string {
  const normalized = value?.trim();
  return normalized || "-";
}

function joinName(values: Array<string | null | undefined>): string {
  const name = values.map((value) => value?.trim()).filter(Boolean).join(" ");
  return name || "-";
}

function joinEnglishName(
  prefix: string | null | undefined,
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  const normalizedFirstName = firstName?.trim();
  const normalizedLastName = lastName?.trim();

  if (!normalizedFirstName && !normalizedLastName) return "-";

  return [prefix?.trim(), normalizedFirstName, normalizedLastName]
    .filter(Boolean)
    .join(" ");
}

function formatNickname(value: string | null | undefined): string {
  const nickname = value?.trim();
  return nickname ? ` (${nickname})` : "";
}

export function createEmploymentContractTemplateVariables(
  data: EmploymentContractData
): ContractTemplateVariables {
  return {
    employeeNameTH: joinName([
      data.employee.prefixTH,
      data.employee.firstNameTH,
      data.employee.lastNameTH,
    ]),
    employeeNameEN: joinEnglishName(
      data.employee.prefixEN,
      data.employee.firstNameEN,
      data.employee.lastNameEN
    ),
    employeeNicknameTH: formatNickname(data.employee.nicknameTH),
    employeeNicknameEN: formatNickname(data.employee.nicknameEN),
    positionTH: displayText(data.employee.positionTH),
    positionEN: displayText(data.employee.positionEN),
    level: displayText(data.employee.level),
    departmentTH: displayText(data.employee.departmentTH),
    departmentEN: displayText(data.employee.departmentEN),
    divisionTH: displayText(data.employee.divisionTH),
    divisionEN: displayText(data.employee.divisionEN),
    salary: formatContractMoney(data.employee.salary),
    salaryEN: formatContractMoneyEN(data.employee.salary),
    salaryTextTH: numberToThaiBahtText(data.employee.salary),
    salaryTextEN: numberToEnglishBahtText(data.employee.salary),
    positionAllowance: formatContractMoney(data.employee.positionAllowance),
    positionAllowanceEN: formatContractMoneyEN(
      data.employee.positionAllowance
    ),
    positionAllowanceTextTH: numberToThaiBahtText(
      data.employee.positionAllowance
    ),
    positionAllowanceTextEN: numberToEnglishBahtText(
      data.employee.positionAllowance
    ),
    totalSalary: formatContractMoney(data.employee.totalSalary),
    totalSalaryEN: formatContractMoneyEN(data.employee.totalSalary),
    totalSalaryTextTH: numberToThaiBahtText(data.employee.totalSalary),
    totalSalaryTextEN: numberToEnglishBahtText(data.employee.totalSalary),
    startDateTH: displayText(data.contract.startDateTH),
    startDateEN: displayText(data.contract.startDateEN),
    endDateTH: displayText(data.contract.endDateTH),
    endDateEN: displayText(data.contract.endDateEN),
    durationDays:
      data.contract.durationDays === null
        ? "-"
        : String(data.contract.durationDays),
    contractNo: displayText(data.contract.contractNo),
    contractDateTH: displayText(data.contract.contractDateTH),
    contractDateEN: displayText(data.contract.contractDateEN),
    companyNameTH: data.company.nameTH,
    companyNameEN: displayText(data.company.nameEN),
    companyAddressTH: displayText(data.company.addressTH),
    companyAddressEN: displayText(data.company.addressEN),
    employerNameTH: data.employer.nameTH,
    employerNameEN: displayText(data.employer.nameEN),
    employerPositionTH: displayText(data.employer.positionTH),
    employerPositionEN: displayText(data.employer.positionEN),
    employeeAddressTH: displayText(data.employee.addressTH),
    employeeAddressEN: displayText(data.employee.addressEN),
  };
}
