class BankAccountSystem {
  constructor() {
    this.accounts = {};
    this.transactions = [];
    this.interestRules = [];
    this.runningNumbers = {}; // To track transaction IDs per day
  }

  getMenuText(title) {
    console.log(`${title}
    [T] Input transactions
    [I] Define interest rules
    [P] Print statement
    [Q] Quit
    `);
  }

  start() {
    this.getMenuText("Welcome to AwesomeGIC Bank! What would you like to do?");

    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.promptUser(rl);
  }

  promptUser(rl) {
    rl.question("> ", (input) => {
      const choice = input.trim().toUpperCase();

      switch (choice) {
        case "T":
          this.inputTransaction(rl);
          break;
        case "I":
          this.defineInterestRule(rl);
          break;
        case "P":
          this.printStatement(rl);
          break;
        case "Q":
          console.clear();
          console.log("\nThank you for banking with AwesomeGIC Bank.");
          console.log("Have a nice day!");
          rl.close();
          break;
        default:
          console.clear();
          console.log("Invalid option. Please try again.");
          this.showMainMenu(rl);
          break;
      }
    });
  }

  showMainMenu(rl) {
    this.getMenuText("\nIs there anything else you'd like to do?");
    this.promptUser(rl);
  }

  /**
   ```

User should be able to enter `T` or `t` to select input transactions menu. Similarly, initial character is used for other options.

## Input transactions
Upon selecting Input transactions option, application prompts user for transaction details.
```
Please enter transaction details in <Date> <Account> <Type> <Amount> format 
(or enter blank to go back to main menu):
>
```

User is then able to enter something like the following:
```
20230626 AC001 W 100.00
```
The system should automatically create the account when the first transaction for the account is created.

Some constraints to note:
* Date should be in YYYYMMdd format
* Account is a string, free format
* Type is D for deposit, W for withdrawal, case insensitive
* Amount must be greater than zero, decimals are allowed up to 2 decimal places
* An account's balance should not be less than 0. Therefore, the first transaction on an account should not be a withdrawal, and any transactions thereafter should not make balance go below 0
* Each transaction should be given a unique id in YYYMMdd-xx format, where xx is a running number (see example below)

Then system responds by displaying the statement of the account:
(assuming there are already some transactions in the account)
``` 
   */
  inputTransaction(rl) {
    console.log(
      "\nPlease enter transaction details in <Date> <Account> <Type> <Amount> format \n (or enter blank to go back to main menu):"
    );
    rl.question("> ", (input) => {
      if (input.trim() === "") {
        this.showMainMenu(rl);
        return;
      }

      const parts = input.trim().split(/\s+/);
      if (parts.length !== 4) {
        console.log("Invalid input format. Please try again.");
        this.inputTransaction(rl);
        return;
      }

      const [dateStr, account, typeStr, amountStr] = parts;
      const type = typeStr.toUpperCase();
      const amount = parseFloat(amountStr);

      // Validate input
      if (!this.isValidDate(dateStr)) {
        console.log("Invalid date format. Please use YYYYMMdd.");
        this.inputTransaction(rl);
        return;
      }

      if (type !== "D" && type !== "W") {
        console.log(
          "Invalid transaction type. Use D for deposit or W for withdrawal."
        );
        this.inputTransaction(rl);
        return;
      }

      if (isNaN(amount) || amount <= 0) {
        console.log("Amount must be a positive number.");
        this.inputTransaction(rl);
        return;
      }

      if (!this.isValidAmount(amountStr)) {
        console.log("Amount must have up to 2 decimal places.");
        this.inputTransaction(rl);
        return;
      }

      // Check account balance for withdrawals
      if (type === "W") {
        const currentBalance = this.getAccountBalance(account);
        if (currentBalance === null) {
          console.log(
            "Cannot withdraw from a new account. First transaction must be a deposit."
          );
          this.inputTransaction(rl);
          return;
        }

        if (currentBalance < amount) {
          console.log("Insufficient balance for this withdrawal.");
          this.inputTransaction(rl);
          return;
        }
      }

      // Generate transaction ID
      const txnId = this.generateTransactionId(dateStr);

      // Record transaction
      const transaction = {
        date: dateStr,
        account,
        type,
        amount,
        txnId,
        balance: 0, // Will be calculated when displaying
      };

      this.transactions.push(transaction);

      // Initialize account if it doesn't exist
      if (!this.accounts[account]) {
        this.accounts[account] = {
          createdDate: dateStr,
          transactions: [],
        };
      }

      this.accounts[account].transactions.push(transaction);

      // Display account statement
      this.displayAccountStatement(account, rl);
    });
  }

  /* 
User is then able to enter something like the following:

```
20230615 RULE03 2.20
```
Some constraints to note:
* Date should be in YYYYMMdd format
* RuleId is string, free format
* Interest rate should be greater than 0 and less than 100
* If there's any existing rules on the same day, the latest one is kept
*/
  defineInterestRule(rl) {
    console.log(
      "\nPlease enter interest rules details in <Date> <RuleId> <Rate in %> format"
    );
    console.log("(or enter blank to go back to main menu):");

    rl.question("> ", (input) => {
      if (input.trim() === "") {
        this.showMainMenu(rl);
        return;
      }

      const parts = input.trim().split(/\s+/);
      if (parts.length !== 3) {
        console.log("Invalid input format. Please try again.");
        this.defineInterestRule(rl);
        return;
      }

      const [dateStr, ruleId, rateStr] = parts;
      const rate = parseFloat(rateStr);

      // Validate input
      if (!this.isValidDate(dateStr)) {
        console.clear();
        console.log("Invalid date format. Please use YYYYMMdd.");
        this.defineInterestRule(rl);
        return;
      }

      if (isNaN(rate) || rate <= 0 || rate >= 100) {
        console.log("Rate must be a number between 0 and 100.");
        this.defineInterestRule(rl);
        return;
      }

      // Check if rule exists for this date
      const existingRuleIndex = this.interestRules.findIndex(
        (r) => r.date === dateStr
      );
      if (existingRuleIndex !== -1) {
        // Replace existing rule
        this.interestRules[existingRuleIndex] = { date: dateStr, ruleId, rate };
      } else {
        // Add new rule
        this.interestRules.push({ date: dateStr, ruleId, rate });
      }

      // Sort rules by date
      this.interestRules.sort((a, b) => a.date.localeCompare(b.date));

      // Display all interest rules
      this.displayInterestRules(rl);
    });
  }

  /*
  ## Print Statement
Upon selecting Print statement option, application prompts user to select which account to print the statement for:

```
Please enter account and month to generate the statement <Account> <Year><Month>
(or enter blank to go back to main menu):
>
```

When user enters the account
```
AC001 202306
```

System then responds with the following account statement, which shows all the transactions and interest for that month (transaction type for interest is I):
```
  */
  printStatement(rl) {
    console.log(
      "\nPlease enter account and month to generate the statement <Account> <Year><Month> \n (or enter blank to go back to main menu):"
    );

    rl.question("> ", (input) => {
      if (input.trim() === "") {
        this.showMainMenu(rl);
        return;
      }

      const parts = input.trim().split(/\s+/);
      if (parts.length !== 2) {
        console.log("Invalid input format. Please try again.");
        this.printStatement(rl);
        return;
      }

      const [account, monthStr] = parts;

      // Validate account exists
      if (!this.accounts[account]) {
        console.log("Account not found.");
        this.printStatement(rl);
        return;
      }

      // Validate month format (YYYYMM)
      if (monthStr.length !== 6 || isNaN(monthStr)) {
        console.log("Invalid month format. Please use YYYYMM.");
        this.printStatement(rl);
        return;
      }

      const year = monthStr.substring(0, 4);
      const month = monthStr.substring(4, 6);

      // Get all transactions for this account in the specified month
      const accountTransactions = this.accounts[account].transactions
        .filter((txn) => txn.date.startsWith(year + month))
        .sort((a, b) => a.date.localeCompare(b.date));

      if (accountTransactions.length === 0) {
        console.log(
          "No transactions found for this account in the specified month."
        );
        this.printStatement(rl);
        return;
      }

      // Calculate running balance and prepare statement lines
      let balance = 0;
      const statementLines = [];

      // First, find the balance before this month
      const transactionsBefore = this.accounts[account].transactions
        .filter((txn) => txn.date < year + month + "01")
        .sort((a, b) => a.date.localeCompare(b.date));

      for (const txn of transactionsBefore) {
        balance = this.calculateNewBalance(balance, txn.type, txn.amount);
      }

      // Now process the month's transactions
      for (const txn of accountTransactions) {
        balance = this.calculateNewBalance(balance, txn.type, txn.amount);
        statementLines.push({
          date: txn.date,
          txnId: txn.txnId,
          type: txn.type,
          amount: txn.amount.toFixed(2),
          balance: balance.toFixed(2),
        });
      }

      // Calculate and add interest for the month
      const interest = this.calculateMonthlyInterest(
        account,
        year + month,
        balance
      );
      if (interest > 0) {
        balance += interest;
        statementLines.push({
          date: year + month + "30", // Last day of month
          txnId: "",
          type: "I",
          amount: interest.toFixed(2),
          balance: balance.toFixed(2),
        });
      }

      // Display the statement
      console.log(`\nAccount: ${account}`);
      console.log("| Date     | Txn Id      | Type | Amount  | Balance  |");
      for (const line of statementLines) {
        console.log(
          `| ${line.date} | ${line.txnId.padEnd(11)} | ${line.type.padEnd(
            4
          )} | ${line.amount.padStart(7)} | ${line.balance.padStart(8)} |`
        );
      }

      this.showMainMenu(rl);
    });
  }

  // Helper methods
  isValidDate(dateStr) {
    if (dateStr.length !== 8 || isNaN(dateStr)) return false;

    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));

    const date = new Date(year, month, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day
    );
  }

  isValidAmount(amountStr) {
    const parts = amountStr.split(".");
    return parts.length === 1 || (parts.length === 2 && parts[1].length <= 2);
  }

  generateTransactionId(dateStr) {
    if (!this.runningNumbers[dateStr]) {
      this.runningNumbers[dateStr] = 0;
    }
    this.runningNumbers[dateStr]++;
    return `${dateStr}-${this.runningNumbers[dateStr]
      .toString()
      .padStart(2, "0")}`;
  }

  getAccountBalance(account) {
    if (!this.accounts[account]) return null;

    let balance = 0;
    for (const txn of this.accounts[account].transactions) {
      balance = this.calculateNewBalance(balance, txn.type, txn.amount);
    }
    return balance;
  }

  calculateNewBalance(balance, type, amount) {
    return type === "D" ? balance + amount : balance - amount;
  }

  displayAccountStatement(account, rl) {
    const transactions = this.accounts[account].transactions.sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    let balance = 0;
    const statementLines = [];

    for (const txn of transactions) {
      balance = this.calculateNewBalance(balance, txn.type, txn.amount);
      statementLines.push({
        date: txn.date,
        txnId: txn.txnId,
        type: txn.type,
        amount: txn.amount.toFixed(2),
        balance: balance.toFixed(2),
      });
    }

    console.log(`\nAccount: ${account}`);
    console.log("| Date     | Txn Id      | Type | Amount  |");
    for (const line of statementLines) {
      console.log(
        `| ${line.date} | ${line.txnId.padEnd(11)} | ${line.type.padEnd(
          4
        )} | ${line.amount.padStart(7)} |`
      );
    }

    this.showMainMenu(rl);
  }

  displayInterestRules(rl) {
    console.log("\nInterest rules:");
    console.log("| Date     | RuleId | Rate (%) |");
    for (const rule of this.interestRules) {
      console.log(
        `| ${rule.date} | ${rule.ruleId.padEnd(6)} | ${rule.rate
          .toFixed(2)
          .padStart(8)} |`
      );
    }

    this.showMainMenu(rl);
  }

  calculateMonthlyInterest(account, monthStr, endBalance) {
    if (this.interestRules.length === 0) return 0;

    const year = parseInt(monthStr.substring(0, 4));
    const month = parseInt(monthStr.substring(4, 6)) - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Get all transactions for this account up to this month
    const allTransactions = this.accounts[account].transactions.sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    let dailyBalances = {};
    let currentBalance = 0;

    // First calculate the balance before this month
    const transactionsBefore = allTransactions.filter(
      (txn) => txn.date < monthStr + "01"
    );
    for (const txn of transactionsBefore) {
      currentBalance = this.calculateNewBalance(
        currentBalance,
        txn.type,
        txn.amount
      );
    }

    // Initialize daily balances with the starting balance
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = monthStr + day.toString().padStart(2, "0");
      dailyBalances[dateKey] = currentBalance;
    }

    // Update balances for each transaction in the month
    const monthTransactions = allTransactions.filter((txn) =>
      txn.date.startsWith(monthStr)
    );
    for (const txn of monthTransactions) {
      const day = parseInt(txn.date.substring(6, 8));
      currentBalance = this.calculateNewBalance(
        currentBalance,
        txn.type,
        txn.amount
      );

      // Update balances from this day forward
      for (let d = day; d <= daysInMonth; d++) {
        const dateKey = monthStr + d.toString().padStart(2, "0");
        dailyBalances[dateKey] = currentBalance;
      }
    }

    // Calculate interest periods
    let totalInterest = 0;
    let currentPeriodStart = monthStr + "01";
    let currentRate = this.getInterestRate(currentPeriodStart);

    for (let day = 2; day <= daysInMonth; day++) {
      const dateKey = monthStr + day.toString().padStart(2, "0");
      const rate = this.getInterestRate(dateKey);

      if (rate !== currentRate) {
        // Calculate interest for the period that just ended
        const periodDays = day - parseInt(currentPeriodStart.substring(6, 8));
        const periodBalance = dailyBalances[currentPeriodStart];

        if (currentRate > 0) {
          const periodInterest =
            (((periodBalance * currentRate) / 100) * periodDays) / 365;
          totalInterest += periodInterest;
        }

        // Start new period
        currentPeriodStart = dateKey;
        currentRate = rate;
      }
    }

    // Calculate interest for the final period
    const finalPeriodDays =
      daysInMonth - parseInt(currentPeriodStart.substring(6, 8)) + 1;
    const finalPeriodBalance = dailyBalances[currentPeriodStart];

    if (currentRate > 0) {
      const finalPeriodInterest =
        (((finalPeriodBalance * currentRate) / 100) * finalPeriodDays) / 365;
      totalInterest += finalPeriodInterest;
    }

    return parseFloat(totalInterest.toFixed(2));
  }

  getInterestRate(date) {
    // Find the most recent interest rule that applies to this date
    const applicableRules = this.interestRules.filter(
      (rule) => rule.date <= date
    );
    if (applicableRules.length === 0) return 0;

    // Get the latest rule
    applicableRules.sort((a, b) => b.date.localeCompare(a.date));
    return applicableRules[0].rate;
  }
}

// Start the application
const bankSystem = new BankAccountSystem();
bankSystem.start();
