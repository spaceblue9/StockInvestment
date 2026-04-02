import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

def create_visualizations(input_file="recommended_stocks.csv", output_file="stock_analysis_dashboard.png"):
    """
    Generates visualizations for the stock recommendations.
    """
    print(f"Loading data from {input_file}...")
    try:
        df = pd.read_csv(input_file)
    except FileNotFoundError:
        print(f"Error: {input_file} not found. Please run the analyzer first.")
        return None

    if df.empty:
        print("Error: No data to visualize.")
        return None

    # --- GLOBAL FONT CONFIGURATION FOR THAI ---
    # We use 'Tahoma' or 'Microsoft Sans Serif' as they are standard on Windows.
    plt.rcParams['font.family'] = 'Tahoma'
    plt.rcParams['axes.unicode_minus'] = False
    
    # Refresh font cache (optional but helpful for some environments)
    sns.set_theme(style="whitegrid", font='Tahoma')
    
    fig, axes = plt.subplots(2, 2, figsize=(16, 16))
    
    # Use tight_layout first, then leave more room at the top for the 2-line main title
    plt.tight_layout(pad=7.0)
    plt.subplots_adjust(top=0.85, bottom=0.12)

    # Main Title - Positioned higher with more space below it
    fig.suptitle("แดชบอร์ดวิเคราะห์และแนะนำหุ้นไทย (Thai Stock Analysis Dashboard)\nวิเคราะห์โดยเน้นความคุ้มค่า (Value) และการเติบโต (Growth)", 
                 fontsize=24, fontweight='bold', color='#2c3e50', y=0.95)

    # 1. Top 10 Recommended Stocks by Score
    top_10 = df.head(10)
    sns.barplot(x="Total_Score", y="Symbol", data=top_10, palette="viridis", ax=axes[0, 0])
    axes[0, 0].set_title("1. หุ้นแนะนำ 10 อันดับแรก (คะแนนรวมสูงสุด)", fontsize=15, fontweight='bold', pad=15)
    axes[0, 0].set_xlabel("คะแนนรวม (ยิ่งสูงยิ่งน่าสนใจ)", fontsize=11)
    axes[0, 0].set_ylabel("ชื่อย่อหุ้น", fontsize=11)

    # 2. PE vs. Yield Scatter Plot
    plot_df = df[df['PE'] < 100]
    sns.scatterplot(x="PE", y="Yield", size="ROE", hue="Total_Score", data=plot_df, palette="coolwarm", sizes=(100, 700), ax=axes[0, 1])
    axes[0, 1].set_title("2. กราฟความสัมพันธ์: ราคา (PE) vs. ปันผล (Yield)", fontsize=15, fontweight='bold', pad=15)
    axes[0, 1].set_xlabel("ค่า PE (ยิ่งต่ำ = ราคาถูก/คุ้มค่า)", fontsize=11)
    axes[0, 1].set_ylabel("อัตราปันผล % (ยิ่งสูง = ผลตอบแทนดี)", fontsize=11)
    
    # Adjusting Annotation to avoid overlapping with Title
    axes[0, 1].annotate('หุ้นราคาถูก & ปันผลสูง\n(โซนน่าสนใจที่สุด)', xy=(8, 6.5), xytext=(25, 6),
                        arrowprops=dict(facecolor='green', shrink=0.05, alpha=0.6, width=2),
                        fontsize=12, color='green', fontweight='bold', 
                        bbox=dict(boxstyle="round,pad=0.4", fc="white", ec="green", alpha=0.9))

    # 3. Distribution of Total Scores
    # Ensure histogram fills the area better by setting range and clear bins
    sns.histplot(df['Total_Score'], bins=12, kde=True, color="#3498db", ax=axes[1, 0], alpha=0.7)
    axes[1, 0].set_title("3. การกระจายคะแนนหุ้นในตลาด (Total Score Distribution)", fontsize=15, fontweight='bold', pad=15)
    axes[1, 0].set_xlabel("ช่วงคะแนน (0-100)", fontsize=11)
    axes[1, 0].set_ylabel("จำนวนหุ้น", fontsize=11)
    axes[1, 0].set_xlim(0, 100) # Force 0-100 range to see the full distribution space

    # 4. Correlation Heatmap (Thai Labels)
    # Map English labels to Thai for the heatmap display
    thai_labels = {
        'PE': 'ค่า PE (ราคา)',
        'PBV': 'ค่า PBV',
        'Yield': 'ปันผล %',
        'ROE': 'ROE (เติบโต)',
        'Total_Score': 'คะแนนรวม'
    }
    
    corr_cols = ['PE', 'PBV', 'Yield', 'ROE', 'Total_Score']
    available_cols = [c for c in corr_cols if c in df.columns]
    corr_df = df[available_cols].rename(columns=thai_labels)
    
    sns.heatmap(corr_df.corr(), annot=True, cmap="YlGnBu", fmt=".2f", ax=axes[1, 1],
                annot_kws={"size": 12, "weight": "bold"})
    axes[1, 1].set_title("4. ตารางความสัมพันธ์ของปัจจัยต่างๆ (Correlation)", fontsize=15, fontweight='bold')
    
    # Detailed Description Box (Bottom)
    description = (
        "📊 รายละเอียดการคำนวณคะแนน:\n"
        "• Value Score (ความคุ้มค่า): ให้คะแนนสูงถ้า PE ต่ำกว่า 15 (ราคาถูก), PBV ต่ำกว่า 1.5 และมีอัตราปันผล (Yield) สูงกว่า 4%\n"
        "• Growth Score (การเติบโต): พิจารณาจาก ROE (ประสิทธิภาพทำกำไร) ยิ่งสูงกว่า 15% ยิ่งได้คะแนนมาก\n"
        "• Total Score (คะแนนรวม): คำนวณจากการถ่วงน้ำหนัก Value (60%) และ Growth (40%) เพื่อหาหุ้นที่ 'ถูกและดี'"
    )
    plt.figtext(0.5, 0.05, description, fontsize=13, ha='center',
                bbox=dict(facecolor='#fdfefe', edgecolor='#d5d8dc', boxstyle='round,pad=1', alpha=1.0))

    # Save the dashboard
    plt.savefig(output_file, dpi=180, bbox_inches='tight')
    print(f"Dashboard saved to {output_file}")
    plt.close()
    print(f"Dashboard saved to {output_file}")
    plt.close()

if __name__ == "__main__":
    create_visualizations()
