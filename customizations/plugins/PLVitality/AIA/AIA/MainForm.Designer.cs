using System.Drawing;
using System.Windows.Forms;

namespace AIA
{
    partial class MainForm
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle1 = new System.Windows.Forms.DataGridViewCellStyle();
            System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle2 = new System.Windows.Forms.DataGridViewCellStyle();
            this.label1 = new System.Windows.Forms.Label();
            this.totalUnsentPanel = new System.Windows.Forms.Panel();
            this.totalUnsent = new System.Windows.Forms.Label();
            this.totalUnsentNum = new System.Windows.Forms.Label();
            this.totalSentPanel = new System.Windows.Forms.Panel();
            this.totalSent = new System.Windows.Forms.Label();
            this.totalSentNum = new System.Windows.Forms.Label();
            this.startService = new System.Windows.Forms.Button();
            this.totalTransaction = new System.Windows.Forms.Label();
            this.totalTransactionNum = new System.Windows.Forms.Label();
            this.tableData = new System.Windows.Forms.DataGridView();
            this.mySqlDataAdapter1 = new MySql.Data.MySqlClient.MySqlDataAdapter();
            this.netStatus = new System.Windows.Forms.Label();
            this.totalUnsentPanel.SuspendLayout();
            this.totalSentPanel.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.tableData)).BeginInit();
            this.SuspendLayout();
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Bold);
            this.label1.ForeColor = System.Drawing.Color.Black;
            this.label1.Location = new System.Drawing.Point(12, 26);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(316, 19);
            this.label1.TabIndex = 0;
            this.label1.Text = "Retail Pro and AIA Integration Monitoring";
            // 
            // totalUnsentPanel
            // 
            this.totalUnsentPanel.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(255)))), ((int)(((byte)(192)))), ((int)(((byte)(255)))));
            this.totalUnsentPanel.Controls.Add(this.totalUnsent);
            this.totalUnsentPanel.Controls.Add(this.totalUnsentNum);
            this.totalUnsentPanel.Location = new System.Drawing.Point(572, 54);
            this.totalUnsentPanel.Name = "totalUnsentPanel";
            this.totalUnsentPanel.Size = new System.Drawing.Size(200, 100);
            this.totalUnsentPanel.TabIndex = 1;
            // 
            // totalUnsent
            // 
            this.totalUnsent.AutoSize = true;
            this.totalUnsent.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Bold);
            this.totalUnsent.ForeColor = System.Drawing.Color.Black;
            this.totalUnsent.Location = new System.Drawing.Point(10, 10);
            this.totalUnsent.Name = "totalUnsent";
            this.totalUnsent.Size = new System.Drawing.Size(111, 19);
            this.totalUnsent.TabIndex = 0;
            this.totalUnsent.Text = "Total Unsent:";
            // 
            // totalUnsentNum
            // 
            this.totalUnsentNum.AutoSize = true;
            this.totalUnsentNum.Font = new System.Drawing.Font("Arial", 20.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.totalUnsentNum.ForeColor = System.Drawing.Color.Black;
            this.totalUnsentNum.Location = new System.Drawing.Point(61, 46);
            this.totalUnsentNum.Name = "totalUnsentNum";
            this.totalUnsentNum.Size = new System.Drawing.Size(29, 32);
            this.totalUnsentNum.TabIndex = 1;
            this.totalUnsentNum.Text = "0";
            // 
            // totalSentPanel
            // 
            this.totalSentPanel.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(192)))), ((int)(((byte)(255)))), ((int)(((byte)(192)))));
            this.totalSentPanel.Controls.Add(this.totalSent);
            this.totalSentPanel.Controls.Add(this.totalSentNum);
            this.totalSentPanel.Location = new System.Drawing.Point(350, 54);
            this.totalSentPanel.Name = "totalSentPanel";
            this.totalSentPanel.Size = new System.Drawing.Size(200, 100);
            this.totalSentPanel.TabIndex = 2;
            // 
            // totalSent
            // 
            this.totalSent.AutoSize = true;
            this.totalSent.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Bold);
            this.totalSent.ForeColor = System.Drawing.Color.Black;
            this.totalSent.Location = new System.Drawing.Point(9, 10);
            this.totalSent.Name = "totalSent";
            this.totalSent.Size = new System.Drawing.Size(91, 19);
            this.totalSent.TabIndex = 2;
            this.totalSent.Text = "Total Sent:";
            // 
            // totalSentNum
            // 
            this.totalSentNum.AutoSize = true;
            this.totalSentNum.Font = new System.Drawing.Font("Arial", 20.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.totalSentNum.ForeColor = System.Drawing.Color.Black;
            this.totalSentNum.Location = new System.Drawing.Point(60, 46);
            this.totalSentNum.Name = "totalSentNum";
            this.totalSentNum.Size = new System.Drawing.Size(29, 32);
            this.totalSentNum.TabIndex = 3;
            this.totalSentNum.Text = "0";
            // 
            // startService
            // 
            this.startService.Location = new System.Drawing.Point(675, 12);
            this.startService.Name = "startService";
            this.startService.Size = new System.Drawing.Size(97, 23);
            this.startService.TabIndex = 3;
            this.startService.Text = "Start Services";
            this.startService.UseVisualStyleBackColor = true;
            this.startService.Visible = false;
            this.startService.Click += new System.EventHandler(this.startService_Click);
            // 
            // totalTransaction
            // 
            this.totalTransaction.AutoSize = true;
            this.totalTransaction.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Bold);
            this.totalTransaction.ForeColor = System.Drawing.Color.DarkGray;
            this.totalTransaction.Location = new System.Drawing.Point(12, 68);
            this.totalTransaction.Name = "totalTransaction";
            this.totalTransaction.Size = new System.Drawing.Size(177, 19);
            this.totalTransaction.TabIndex = 4;
            this.totalTransaction.Text = "Total AIA Transactions";
            // 
            // totalTransactionNum
            // 
            this.totalTransactionNum.AutoSize = true;
            this.totalTransactionNum.Font = new System.Drawing.Font("Arial", 20.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.totalTransactionNum.ForeColor = System.Drawing.Color.Black;
            this.totalTransactionNum.Location = new System.Drawing.Point(123, 100);
            this.totalTransactionNum.Name = "totalTransactionNum";
            this.totalTransactionNum.Size = new System.Drawing.Size(29, 32);
            this.totalTransactionNum.TabIndex = 4;
            this.totalTransactionNum.Text = "0";
            // 
            // tableData
            // 
            this.tableData.AllowUserToAddRows = false;
            this.tableData.AutoSizeColumnsMode = System.Windows.Forms.DataGridViewAutoSizeColumnsMode.Fill;
            this.tableData.AutoSizeRowsMode = System.Windows.Forms.DataGridViewAutoSizeRowsMode.AllCells;
            dataGridViewCellStyle1.Alignment = System.Windows.Forms.DataGridViewContentAlignment.MiddleCenter;
            dataGridViewCellStyle1.BackColor = System.Drawing.SystemColors.Control;
            dataGridViewCellStyle1.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            dataGridViewCellStyle1.ForeColor = System.Drawing.SystemColors.WindowText;
            dataGridViewCellStyle1.SelectionBackColor = System.Drawing.SystemColors.Highlight;
            dataGridViewCellStyle1.SelectionForeColor = System.Drawing.SystemColors.HighlightText;
            dataGridViewCellStyle1.WrapMode = System.Windows.Forms.DataGridViewTriState.True;
            this.tableData.ColumnHeadersDefaultCellStyle = dataGridViewCellStyle1;
            this.tableData.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            dataGridViewCellStyle2.Alignment = System.Windows.Forms.DataGridViewContentAlignment.MiddleCenter;
            dataGridViewCellStyle2.BackColor = System.Drawing.SystemColors.Window;
            dataGridViewCellStyle2.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            dataGridViewCellStyle2.ForeColor = System.Drawing.SystemColors.ControlText;
            dataGridViewCellStyle2.SelectionBackColor = System.Drawing.SystemColors.Highlight;
            dataGridViewCellStyle2.SelectionForeColor = System.Drawing.SystemColors.HighlightText;
            dataGridViewCellStyle2.WrapMode = System.Windows.Forms.DataGridViewTriState.False;
            this.tableData.DefaultCellStyle = dataGridViewCellStyle2;
            this.tableData.Location = new System.Drawing.Point(12, 180);
            this.tableData.Name = "tableData";
            this.tableData.ReadOnly = true;
            this.tableData.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
            this.tableData.Size = new System.Drawing.Size(760, 269);
            this.tableData.TabIndex = 5;
            // 
            // mySqlDataAdapter1
            // 
            this.mySqlDataAdapter1.DeleteCommand = null;
            this.mySqlDataAdapter1.InsertCommand = null;
            this.mySqlDataAdapter1.SelectCommand = null;
            this.mySqlDataAdapter1.UpdateCommand = null;
            // 
            // netStatus
            // 
            this.netStatus.AutoSize = true;
            this.netStatus.Font = new System.Drawing.Font("Arial", 9.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.netStatus.Location = new System.Drawing.Point(374, 25);
            this.netStatus.Name = "netStatus";
            this.netStatus.Size = new System.Drawing.Size(279, 16);
            this.netStatus.TabIndex = 6;
            this.netStatus.Text = "No internet connection. Offline Mode is activate";
            this.netStatus.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            this.netStatus.Visible = false;
            // 
            // MainForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(784, 461);
            this.Controls.Add(this.netStatus);
            this.Controls.Add(this.tableData);
            this.Controls.Add(this.totalTransactionNum);
            this.Controls.Add(this.totalTransaction);
            this.Controls.Add(this.startService);
            this.Controls.Add(this.totalSentPanel);
            this.Controls.Add(this.totalUnsentPanel);
            this.Controls.Add(this.label1);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.Name = "MainForm";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Retail Pro and AIA Integration";
            this.totalUnsentPanel.ResumeLayout(false);
            this.totalUnsentPanel.PerformLayout();
            this.totalSentPanel.ResumeLayout(false);
            this.totalSentPanel.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.tableData)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Panel totalUnsentPanel;
        private System.Windows.Forms.Panel totalSentPanel;
        private Label totalUnsent;
        private Label totalUnsentNum;
        private Label totalSent;
        private Label totalSentNum;
        private Button startService;
        private Label totalTransaction;
        private Label totalTransactionNum;
        private DataGridView tableData;
        private MySql.Data.MySqlClient.MySqlDataAdapter mySqlDataAdapter1;
        private Label netStatus;
    }
}

