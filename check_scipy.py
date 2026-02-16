import scipy
import scipy.stats as stats
import numpy as np

print(f"Scipy version: {scipy.__version__}")

try:
    x = np.array([1, 2, 3, 4, 5])
    y = np.array([1.1, 2.1, 3.1, 4.1, 5.1])
    res = stats.wilcoxon(x, y)
    print(f"Result type: {type(res)}")
    print(f"Result: {res}")

    if hasattr(res, "statistic"):
        print(f"Result has .statistic: {res.statistic}")
    else:
        print("Result does NOT have .statistic")

except Exception as e:
    print(f"Error: {e}")
